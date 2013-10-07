/*
  Moves the board around the screen, so it stays centered, unless the window is too small.
*/
function setBoardPosition() {
  topOff = ($(window).height() - $("#game-board").height())/2;
  leftOff = ($("#game-area").width() - $("#game-board").width())/2 + 150;

  topOff = topOff > 10 ? topOff : 10;
  leftOff = leftOff > 160 ? leftOff : 160;
  $("#game-board").offset({ top: topOff, left: leftOff});
}

/*
  Sets the game board wrapper's height to the current window size.
*/
var setGameHeight = function() {
  $("#game-area").height($(window).height());
  setBoardPosition();
};

/*
  Returns a random integer between min and max, inclusive.
*/
function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var boardArray = [];
var active = false;
var flaggedCount = 0;
var totalMines = 0;

/*
  Checks to see if all of the bombs have been flagged, and if so, marks the game as won.
*/
function winCheck() {
  for (var i = 0; i < boardArray.length; i ++) {
    for (var j = 0; j < boardArray[i].length; j++) {
      if (boardArray[i][j] == -1 && !$("#game-sq-"+ i + "-" + j).hasClass('flagged')) {
        return false;
      }
    }
  }
  $("#game-board").addClass('won');
  revealBoard();
  active = false;
  return true;
}

/*
  Outlines the locations of the bombs.
*/
function cheat() {
  for (var i = 0; i < boardArray.length; i ++) {
    for (var j = 0; j < boardArray[i].length; j++) {
      if (boardArray[i][j] == -1) {
        $("#game-sq-"+ i + "-" + j).addClass('cheat');
      }
    }
  }
}

/*
  Sets each cell's text to its number/bomb. Mostly used when the game is over to show results. 
*/
function revealBoard() {
  for (var i = 0; i < boardArray.length; i ++) {
    for (var j = 0; j < boardArray[i].length; j++) {
      var code = boardArray[i][j];
      if (code == -1) {
        $("#game-sq-"+ i + "-" + j).html("B")
      } else if (code == 0){
        $("#game-sq-"+ i + "-" + j).html("");
      } else {
        $("#game-sq-"+ i + "-" + j).html(code);
      }
    }
  }
}

/*
  Generates a new gameboard, setting bombs and danger scores for squares. 
*/
var makeBoard = function() {
  $("#game-board").html("");
  var rows = $("#game-height").val();
  var cols = $("#game-width").val();
  var mines = $("#game-mines").val();

  // Create the DOM elements to represent the board, linking the click actions to them.
  for( var i = 0; i < rows; i++) {
    $('#game-board').append('<tr></tr>');
    for(var j = 0; j < cols; j++) {
        $('#game-board').find('tr').eq(i).append('<td><a id="game-sq-' + i + '-' + j+ '" onclick="digSquare('+ i + ',' + j + ', false)" oncontextmenu="digSquare('+ i + ',' + j + ', true)"></a></td>');
        $('#game-board').find('tr').eq(i).find('td').eq(j).attr('data-row',i).attr('data-col', j);
        $('#game-sq-' + i + '-' + j).click(function(event) {
          digSquare(event, parseInt($(this).parent().attr("data-row")), parseInt($(this).parent().attr("data-col")));
        });
        $('#game-sq-' + i + '-' + j).bind('contextmenu', function(event) {
          event.preventDefault();
          flagSquare(event, parseInt($(this).parent().attr("data-row")), parseInt($(this).parent().attr("data-col")));
        });
      }
    }

    // Generate the record for the game board.
    for (i = 0; i < rows; i++) {
      boardArray[i] = [];
      for(j = 0; j < cols; j++) {
        boardArray[i][j] = 0;
      }
    }

    // Places the mines, setting the danger scores for surrounding squares.
    for (i = 0; i < mines; i++)
    {
      placed = false;
      while (!placed)
      {
        randRow = getRandomInt(0, rows - 1);
        randCol = getRandomInt(0, cols - 1);
        if (boardArray[randRow][randCol] != -1)
        {
          boardArray[randRow][randCol] = -1;
          left = randCol == 0;
          up = randRow == 0;
          right = randCol == cols - 1;
          down = randRow == rows - 1;

          if (!up)
          {
            if (!left)
              boardArray[randRow-1][randCol-1] != -1 ? boardArray[randRow-1][randCol-1]++ : -1;
            boardArray[randRow-1][randCol] != -1 ? boardArray[randRow-1][randCol]++ : -1;
            if (!right)
              boardArray[randRow-1][randCol+1] != -1 ? boardArray[randRow-1][randCol+1]++ : -1;
          }
          if (!down)
          {
            if (!left)
              boardArray[randRow+1][randCol-1] != -1 ? boardArray[randRow+1][randCol-1]++ : -1;
            boardArray[randRow+1][randCol] != -1 ? boardArray[randRow+1][randCol]++ : -1;
            if (!right)
              boardArray[randRow+1][randCol+1] != -1 ? boardArray[randRow+1][randCol+1]++ : -1;
          }
          if (!right)
            boardArray[randRow][randCol+1] != -1 ? boardArray[randRow][randCol+1]++ : -1;
          if (!left)
            boardArray[randRow][randCol-1] != -1 ? boardArray[randRow][randCol-1]++ : -1;

          placed = true;
        }
      }
    }

    // Final Bookkeeping.
    setBoardPosition();
    $("#game-board").removeClass('lost');
    $("#game-board").removeClass('won');
    flaggedCount = 0;
    totalMines = mines;
    active = true;
};

/*
  Marks a square as flagged, making it undiggable.
*/
function flagSquare(e, row, col) {
  var clickedSquare = $("#game-sq-"+ row + "-" + col);
  if (clickedSquare.hasClass('revealed')){
    return;
  }

  clickedSquare.toggleClass('flagged');
  if (clickedSquare.hasClass('flagged')) {
    flaggedCount ++;
    clickedSquare.html("X");
    if (flaggedCount == totalMines) {
      winCheck();
    }
  } else {
    flaggedCount --;
    clickedSquare.html("");
  }
}

/*
  Opens up a square, ending the game if it's a bomb, or revealing it if it's empty.
  If the square has 0 danger, it will reveal out until it hits dangerous squares.
*/
function digSquare(e, row, col) {
  var key = boardArray[row][col];
  var clickedSquare = $("#game-sq-"+ row + "-" + col);

  if (clickedSquare.hasClass('revealed') || !active || clickedSquare.hasClass('flagged')) {
    return;
  }

  if (key == -1) { 
    clickedSquare.addClass('revealed');
    clickedSquare.html("B");
    $("#game-board").addClass('lost');
    revealBoard();
    active = false;
  } else if (key == 0) {
    var revList = [];
    revList.push([row, col]);

    while (toCheck = revList.shift()) {
      if (toCheck[0] < 0 || toCheck[0] >= boardArray.length || toCheck[1] < 0 || toCheck[1] >= boardArray[0].length) {
        continue;
      }
      if  (boardArray[toCheck[0]][toCheck[1]] > -1) {
        if ($("#game-sq-"+ toCheck[0] + "-" + toCheck[1]).hasClass('revealed')) {
          continue;
        }

        if ($("#game-sq-"+ toCheck[0] + "-" + toCheck[1]).hasClass('flagged')) {
           $("#game-sq-"+ toCheck[0] + "-" + toCheck[1]).removeClass('flagged');
           flaggedCount--;
        }

        $("#game-sq-"+ toCheck[0] + "-" + toCheck[1]).addClass('revealed');
        $("#game-sq-"+ toCheck[0] + "-" + toCheck[1]).html(boardArray[toCheck[0]][toCheck[1]] == 0 ? "" : boardArray[toCheck[0]][toCheck[1]]);
        if (boardArray[toCheck[0]][toCheck[1]] == 0) {
          revList.push([toCheck[0]+1, toCheck[1]-1]);
          revList.push([toCheck[0]+1, toCheck[1]]);
          revList.push([toCheck[0]+1, toCheck[1]+1]);
          revList.push([toCheck[0], toCheck[1]+1]);
          revList.push([toCheck[0]-1, toCheck[1]+1]);
          revList.push([toCheck[0]-1, toCheck[1]]);
          revList.push([toCheck[0]-1, toCheck[1]-1]);
          revList.push([toCheck[0], toCheck[1]-1]);
        }
      }
    }
  } else {
    clickedSquare.addClass('revealed');
    clickedSquare.html(boardArray[row][col]);
  }
}