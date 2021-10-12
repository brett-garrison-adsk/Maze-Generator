const createBlock = async (w,l,h) => {
    const pt1 = await WSM.Geom.Point3d(0,0,0);
    const pt2 = await WSM.Geom.Point3d(w,l,h);
    const histID = await FormIt.GroupEdit.GetEditingHistoryID();
    console.log(histID, pt1, pt2)

    const test = await WSM.APICreateBlock(histID, pt1, pt2);
}

document.getElementById("CreateBlockBtn").addEventListener("click", () => {
    const w = Number(document.getElementById("Width").value);
    const h = Number(document.getElementById("Height").value);
    const l = Number(document.getElementById("Length").value);

    //createBlock(w,l,h);
    setup();
    draw();
});

var cols, rows,
    w = 50,
    ww = 10 / 2,
    grid = [],
    cols = floor(width / w),
    rows = floor(height / w),

    current,

    stack = [];

function setup() {
  for (var j = 0; j < rows; j++) {
    for (var i = 0; i < cols; i++) {
      var cell = new Cell(i, j);
      grid.push(cell);
    }
  }

  current = grid[0];
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
      var r = floor(random(0, neighbors.length));
      return neighbors[r];
    } else {
      return undefined;
    }


  }

  this.show = function() {
    var x = this.i * w;
    var y = this.j * w;
    
    // Top
    if (this.walls[0]) {
      line(this.left && !this.left.walls[1] ? (x - ww) : (x + ww), y + ww, 
           this.right && !this.right.walls[3] ? (x + w + ww) : (x + w - ww), y + ww);
      
      // Cap Left
      if(this.left && !this.left.walls[0])
        line(x - ww, y + ww, x - ww, y);
      
      // Cap Right
      if(this.right && !this.right.walls[0])
        line(x + w + ww, y + ww, x + w + ww, y);
    }
    
    // Right
    if (this.walls[1]) {
      line(x + w - ww, this.top && !this.top.walls[2] ? (y - ww) : (y + ww), 
           x + w - ww, this.bottom && !this.bottom.walls[0] ? (y + w + ww) : (y + w - ww));
      
      // Cap Top
      if(this.top && !this.top.walls[1])
        line(x + w - ww, y - ww, x + w, y - ww);
      
      // Cap Bottom
      if(this.bottom && !this.bottom.walls[1])
        line(x + w - ww, y + w + ww, x + w, y + w + ww);
    }
    
    // Bottom
    if (this.walls[2]) {
      line(this.right && !this.right.walls[3] ? (x + w + ww) : (x + w - ww), y + w - ww, 
        this.left && !this.left.walls[1] ? (x - ww) : (x + ww), y + w - ww);
      
      // Cap Left
      if(this.left && !this.left.walls[2])
        line(x - ww, y + w - ww, x - ww, y + w + ww);
      // Cap Right
      if(this.right && !this.right.walls[2])
        line(x + w + ww, y + w - ww, x + w + ww, y + w);
    }
    
    // Left
    if (this.walls[3]) {
      line(x + ww, this.bottom && !this.bottom.walls[0] ? (y + w + ww) : (y + w - ww), 
           x + ww, this.top && !this.top.walls[2] ? (y - ww) : (y + ww));
      
      // Cap Top
      if(this.top && !this.top.walls[3])
        line(x + ww, y - ww, x, y - ww);
      // Cap Bottom
      if(this.bottom && !this.bottom.walls[3])
        line(x + ww, y + w + ww, x, y + w + ww);
    }
  }
}
