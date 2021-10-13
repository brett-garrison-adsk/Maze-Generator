const createBlock = async (w,l,h) => {
    const pt1 = await WSM.Geom.Point3d(0,0,0);
    const pt2 = await WSM.Geom.Point3d(w,l,h);
    const histID = await FormIt.GroupEdit.GetEditingHistoryID();
    console.log(histID, pt1, pt2)

    const test = await WSM.APICreateBlock(histID, pt1, pt2);
}

document.getElementById("CreateBlockBtn").addEventListener("click", async () => {
    width = Number(document.getElementById("Width").value);
    // const h = Number(document.getElementById("Height").value);
    len = Number(document.getElementById("Length").value);

    w = Number(document.getElementById("Size").value);
    ww = Math.floor(Number(document.getElementById("Wall").value) / 2);

    //createBlock(w,l,h);
    await setup();
    //draw();
});

var width, height, len, cols, rows,
    w,
    ww,
    grid = [],

    current,

    stack = [],

    histID = await FormIt.GroupEdit.GetEditingHistoryID();

async function setup() {
    grid = []
    cols = Math.floor(width / w)
    rows = Math.floor(len / w)
    for (var j = 0; j < rows; j++) {
        for (var i = 0; i < cols; i++) {
            var cell = new Cell(i, j);
            grid.push(cell);
        }
    }

    current = grid[0];

    // Draw outter border
    var obj = await WSM.APICreateRectangle(histID, 
        await WSM.Geom.Point3d(0, 0, 0),
        await WSM.Geom.Point3d(width, 0, 0),
        await WSM.Geom.Point3d(width, len, 0)
    );

    var objid = await WSM.Utils.GetFaceIDFromCoedge(histId, 1);

    debugger;

    await WSM.APIDragFace(histID, 10, 5.0, true);

    /*
    await WSM.APIConnectPoint3ds(histID, 
        await WSM.Geom.Point3d(0, 0, 0), 
        
    );
    await WSM.APIConnectPoint3ds(histID, 
        await WSM.Geom.Point3d(width, 0, 0), 
        
    );
    await WSM.APIConnectPoint3ds(histID, 
        await WSM.Geom.Point3d(width, len, 0), 
        await WSM.Geom.Point3d(0, len, 0)
    );
    await WSM.APIConnectPoint3ds(histID, 
        await WSM.Geom.Point3d(0, len, 0), 
        await WSM.Geom.Point3d(0, 0, 0)
    );
    */
}

function draw() {
  while(step()) {}
  
  for (var i = 0; i < grid.length; i++) {
    grid[i].show();
  }
}

function step() {
  current.visited = true;
  
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
    var x = this.i * w;
    var y = this.j * w;
    
    //var histID = await FormIt.GroupEdit.GetEditingHistoryID();

    // Top
    if (this.walls[0]) {
        WSM.APIConnectPoint3ds(histID, 
            await WSM.Geom.Point3d(this.left && !this.left.walls[1] ? (x - ww) : (x + ww), y + ww, 0), 
            await WSM.Geom.Point3d(this.right && !this.right.walls[3] ? (x + w + ww) : (x + w - ww), y + ww, 0)
        );

        // Cap Left
        if(this.left && !this.left.walls[0])
            WSM.APIConnectPoint3ds(histID, 
                await WSM.Geom.Point3d(x - ww, y + ww, 0), 
                await WSM.Geom.Point3d(x - ww, y, 0)
            );

        // Cap Right
        if(this.right && !this.right.walls[0])
            WSM.APIConnectPoint3ds(histID, 
                await WSM.Geom.Point3d(x + w + ww, y + ww, 0), 
                await WSM.Geom.Point3d(x + w + ww, y, 0)
            );
    }

    // Right
    if (this.walls[1]) {
        WSM.APIConnectPoint3ds(histID, 
            await WSM.Geom.Point3d(x + w - ww, this.top && !this.top.walls[2] ? (y - ww) : (y + ww), 0), 
            await WSM.Geom.Point3d(x + w - ww, this.bottom && !this.bottom.walls[0] ? (y + w + ww) : (y + w - ww), 0)
        );
      
        // Cap Top
        if(this.top && !this.top.walls[1])
            WSM.APIConnectPoint3ds(histID, 
                await WSM.Geom.Point3d(x + w - ww, y - ww, 0), 
                await WSM.Geom.Point3d(x + w, y - ww, 0)
            );

        // Cap Bottom
        if(this.bottom && !this.bottom.walls[1])
            WSM.APIConnectPoint3ds(histID, 
                await WSM.Geom.Point3d(x + w - ww, y + w + ww, 0), 
                await WSM.Geom.Point3d(x + w, y + w + ww, 0)
            );
    }
    
    // Bottom
    if (this.walls[2]) {
        WSM.APIConnectPoint3ds(histID, 
            await WSM.Geom.Point3d(this.right && !this.right.walls[3] ? (x + w + ww) : (x + w - ww), y + w - ww, 0), 
            await WSM.Geom.Point3d(this.left && !this.left.walls[1] ? (x - ww) : (x + ww), y + w - ww, 0)
        );
      
        // Cap Left
        if(this.left && !this.left.walls[2])
            WSM.APIConnectPoint3ds(histID, 
                await WSM.Geom.Point3d(x - ww, y + w - ww, 0), 
                await WSM.Geom.Point3d(x - ww, y + w + ww, 0)
            );

        // Cap Right
        if(this.right && !this.right.walls[2])
            WSM.APIConnectPoint3ds(histID, 
                await WSM.Geom.Point3d(x + w + ww, y + w - ww, 0), 
                await WSM.Geom.Point3d(x + w + ww, y + w, 0)
            );
    }
    
    // Left
    if (this.walls[3]) {
        WSM.APIConnectPoint3ds(histID, 
            await WSM.Geom.Point3d(x + ww, this.bottom && !this.bottom.walls[0] ? (y + w + ww) : (y + w - ww), 0), 
            await WSM.Geom.Point3d(x + ww, this.top && !this.top.walls[2] ? (y - ww) : (y + ww), 0)
        );
      
      // Cap Top
      if(this.top && !this.top.walls[3])
        WSM.APIConnectPoint3ds(histID, 
            await WSM.Geom.Point3d(x + ww, y - ww, 0), 
            await WSM.Geom.Point3d(x, y - ww, 0)
        );

      // Cap Bottom
      if(this.bottom && !this.bottom.walls[3])
        WSM.APIConnectPoint3ds(histID, 
            await WSM.Geom.Point3d(x + ww, y + w + ww, 0), 
            await WSM.Geom.Point3d(x, y + w + ww, 0)
        );
    }
  }
}
