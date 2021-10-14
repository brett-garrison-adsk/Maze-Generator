// Credits to Daniel Shiffman
// http://codingtra.in
// http://patreon.com/codingtrain

// Videos
// https://youtu.be/HyK_Q5rrcr4
// https://youtu.be/D8UgRyRnvXU
// https://youtu.be/8Ju_uxJ9v44
// https://youtu.be/_p5IH0L63wo

// Depth-first search
// Recursive backtracker
// https://en.wikipedia.org/wiki/Maze_generation_algorithm

const btnMaze = document.getElementById("CreateMazeBtn");

btnMaze.addEventListener("click", async () => {
    width = Number(document.getElementById("Width").value);
    if(width < 0)
        return alert("Maze width must be greater than 0")
    height = Number(document.getElementById("Height").value);
    if(height < 0)
        return alert("Maze height must be greater than 0")
    len = Number(document.getElementById("Length").value);
    if(len < 0)
        return alert("Maze length must be greater than 0")

    w = Number(document.getElementById("Size").value);
    if(w < 0)
        return alert("Cell size must be greater than 0")
    
    wall = Number(document.getElementById("Wall").value) / 2;
    if(wall < 0)
        return alert("Wall width must be greater than 0")
    if(wall * 4 > width ||
        wall * 4 > len)
        return alert("Combined wall widths must be less than maze width and height")
    l = w;

    // Lock the generate button
    btnMaze.disabled = true;

    await FormIt.UndoManagement.BeginState("maze");
    await setup();
    await draw();
    await FormIt.UndoManagement.EndState("maze");

    // Unlock the generate button
    btnMaze.disabled = false;
});

var width, height, len, cols, rows,
    w,
    wall,
    grid = [],
    current,
    stack = [],
    histID

async function setup() {
    histID = await FormIt.GroupEdit.GetEditingHistoryID();
    
    // Draw outter border
    var obj = await WSM.APICreateRectangle(histID, 
        await WSM.Geom.Point3d(0, 0, 0),
        await WSM.Geom.Point3d(width, 0, 0),
        await WSM.Geom.Point3d(width, len, 0)
    );

    // Reduce the width and length of the inside of the maze
    // to account for the outter walls
    width -= wall * 2
    len -= wall * 2

    // Reset grid
    grid = []

    // Get columns and rows
    cols = Math.floor(width / w)
    rows = Math.floor(len / w)

    // Error trap some sizes
    cols = cols <= 0 ? 1 : cols
    rows = rows <= 0 ? 1 : rows

    // Adjust cell size if original size wouldn't fill maze
    w = width / cols
    l = len / rows

    // Fill grid with cells
    for (var j = 0; j < rows; j++) {
        for (var i = 0; i < cols; i++) {
            var cell = new Cell(i, j);
            grid.push(cell);
        }
    }

    // Set first cell
    current = grid[0];  
}

async function draw() {
  // Generate the maze
  while(step()) {}
  
  // Render the walls
  for (var i = 0; i < grid.length; i++) {
    await grid[i].show();
  }

  // Gets the face ids
  var objids = await WSM.Utils.GetAllNonOwnedGeometricObjects(histID);

  // Deletes the floor of the hallways
  await WSM.APIDeleteObject(histID, objids[1]);

  // Raises the walls
  await WSM.APIDragFace(histID, objids[0], height, true);
}

function step() {
  current.visited = true;
  
  // Follows the steps for a recursive backtracker
  // https://en.wikipedia.org/wiki/Maze_generation_algorithm
  
  // STEP 1
  var next = current.checkNeighbors();
  if (next) {
    next.visited = true;

    // STEP 2
    stack.push(current);

    // STEP 3
    removeWalls(current, next);

    // STEP 4
    current = next;
  } else if (stack.length > 0) {
    current = stack.pop();
  } else {
    return false;
  }

  return current;
}

function index(i, j) {
  if (i < 0 || j < 0 || i > cols - 1 || j > rows - 1) {
    return -1;
  }
  return i + j * cols;
}

function removeWalls(a, b) {
  var x = a.i - b.i;
  if (x === 1) {
    a.walls[3] = false;
    b.walls[1] = false;
  } else if (x === -1) {
    a.walls[1] = false;
    b.walls[3] = false;
  }
  var y = a.j - b.j;
  if (y === 1) {
    a.walls[0] = false;
    b.walls[2] = false;
  } else if (y === -1) {
    a.walls[2] = false;
    b.walls[0] = false;
  }
}

function Cell(i, j) {
  this.i = i;
  this.j = j;
  this.walls = [true, true, true, true];
  this.visited = false;

  this.checkNeighbors = function() {
    var neighbors = [];

    this.top = grid[index(i, j - 1)];
    this.right = grid[index(i + 1, j)];
    this.bottom = grid[index(i, j + 1)];
    this.left = grid[index(i - 1, j)];

    if (this.top && !this.top.visited) {
      neighbors.push(this.top);
    }
    if (this.right && !this.right.visited) {
      neighbors.push(this.right);
    }
    if (this.bottom && !this.bottom.visited) {
      neighbors.push(this.bottom);
    }
    if (this.left && !this.left.visited) {
      neighbors.push(this.left);
    }

    if (neighbors.length > 0) {
      var r = Math.floor(Math.random() * neighbors.length);
      return neighbors[r];
    } else {
      return undefined;
    }
  }

  this.show = async function() {
    var x = (this.i * w) + wall;
    var y = (this.j * l) + wall;

    // Top
    if (this.walls[0]) {
        WSM.APIConnectPoint3ds(histID, 
            await WSM.Geom.Point3d(this.left && !this.left.walls[1] ? (x - wall) : (x + wall), y + wall, 0), 
            await WSM.Geom.Point3d(this.right && !this.right.walls[3] ? (x + w + wall) : (x + w - wall), y + wall, 0)
        );

        // Cap Left
        if(this.left && !this.left.walls[0])
            WSM.APIConnectPoint3ds(histID, 
                await WSM.Geom.Point3d(x - wall, y + wall, 0), 
                await WSM.Geom.Point3d(x - wall, y, 0)
            );

        // Cap Right
        if(this.right && !this.right.walls[0])
            WSM.APIConnectPoint3ds(histID, 
                await WSM.Geom.Point3d(x + w + wall, y + wall, 0), 
                await WSM.Geom.Point3d(x + w + wall, y, 0)
            );
    }

    // Right
    if (this.walls[1]) {
        WSM.APIConnectPoint3ds(histID, 
            await WSM.Geom.Point3d(x + w - wall, this.top && !this.top.walls[2] ? (y - wall) : (y + wall), 0), 
            await WSM.Geom.Point3d(x + w - wall, this.bottom && !this.bottom.walls[0] ? (y + l + wall) : (y + l - wall), 0)
        );
      
        // Cap Top
        if(this.top && !this.top.walls[1])
            WSM.APIConnectPoint3ds(histID, 
                await WSM.Geom.Point3d(x + w - wall, y - wall, 0), 
                await WSM.Geom.Point3d(x + w, y - wall, 0)
            );

        // Cap Bottom
        if(this.bottom && !this.bottom.walls[1])
            WSM.APIConnectPoint3ds(histID, 
                await WSM.Geom.Point3d(x + w - wall, y + l + wall, 0), 
                await WSM.Geom.Point3d(x + w, y + l + wall, 0)
            );
    }
    
    // Bottom
    if (this.walls[2]) {
        WSM.APIConnectPoint3ds(histID, 
            await WSM.Geom.Point3d(this.right && !this.right.walls[3] ? (x + w + wall) : (x + w - wall), y + l - wall, 0), 
            await WSM.Geom.Point3d(this.left && !this.left.walls[1] ? (x - wall) : (x + wall), y + l - wall, 0)
        );
      
        // Cap Left
        if(this.left && !this.left.walls[2])
            WSM.APIConnectPoint3ds(histID, 
                await WSM.Geom.Point3d(x - wall, y + l - wall, 0), 
                await WSM.Geom.Point3d(x - wall, y + l + wall, 0)
            );

        // Cap Right
        if(this.right && !this.right.walls[2])
            WSM.APIConnectPoint3ds(histID, 
                await WSM.Geom.Point3d(x + w + wall, y + l - wall, 0), 
                await WSM.Geom.Point3d(x + w + wall, y + l, 0)
            );
    }
    
    // Left
    if (this.walls[3]) {
        WSM.APIConnectPoint3ds(histID, 
            await WSM.Geom.Point3d(x + wall, this.bottom && !this.bottom.walls[0] ? (y + l + wall) : (y + l - wall), 0), 
            await WSM.Geom.Point3d(x + wall, this.top && !this.top.walls[2] ? (y - wall) : (y + wall), 0)
        );
      
      // Cap Top
      if(this.top && !this.top.walls[3])
        WSM.APIConnectPoint3ds(histID, 
            await WSM.Geom.Point3d(x + wall, y - wall, 0), 
            await WSM.Geom.Point3d(x, y - wall, 0)
        );

      // Cap Bottom
      if(this.bottom && !this.bottom.walls[3])
        WSM.APIConnectPoint3ds(histID, 
            await WSM.Geom.Point3d(x + wall, y + l + wall, 0), 
            await WSM.Geom.Point3d(x, y + l + wall, 0)
        );
    }
  }
}
