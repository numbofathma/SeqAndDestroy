var rowManager = (function() {
  "use strict";

  var createRowManager = function(options) {
    return new RowManager(options);
  };

  var RowManager = function(options) {
    if (options === undefined) throw "no options";
    if (options.game === undefined) throw "no game";
    if (options.columnsCount === undefined) throw "no columnsCount";
    if (options.rowsCount === undefined) throw "no rowsCount";
    if (options.columnWidth === undefined) throw "no columnWidth";
    if (options.rowHeight === undefined) throw "no rowHeight";
    if (options.elementConstructor === undefined) {
      throw "no elementConstructor";
    }
    if (options.gameWinCallback === undefined) throw "no gameWinCallback";

    this._game = options.game;
    this._columnsCount = options.columnsCount;
    this._columnWidth = options.columnWidth;
    this._rowHeight = options.rowHeight;
    this._elementConstructor = options.elementConstructor;
    this._gameWinCallback = options.gameWinCallback;

    this._rows = [];
    for (var i = options.rowsCount - 1; i >= 0;  i--) {
      var rowHeight = this.computeYFromRow(i);
      this._rows.push(this._createRow(rowHeight));
    }
    this._activeRowIndex = 0;
    this._activeRow = this._rows[this._activeRowIndex];
  };

  RowManager.prototype._createRow = function(height) {
    var row = this._game.add.group();

    for (var i = 0; i < this._columnsCount; i++) {
      var x = this.computeXFromColumn(i);
      var elem = this._elementConstructor({ x: x, y: height });
      row.add(elem);
    }

    this._game.physics.enable(row, Phaser.Physics.ARCADE);

    return row;
  };

  RowManager.prototype.computeXFromColumn = function(col) {
    return col*this._columnWidth + this._columnWidth/2;
  };

  RowManager.prototype.computeYFromRow = function(row) {
    return row*this._rowHeight + this._rowHeight/2;
  };

  RowManager.prototype.getActiveRow = function() {
    return this._activeRow;
  };

  RowManager.prototype.getRowHeight = function() {
    return this._rowHeight;
  };

  RowManager.prototype.nextRow = function() {
    this._activeRow.destroy();
    this._activeRowIndex++;
    if (this._activeRowIndex < this._rows.length) {
      this._activeRow = this._rows[this._activeRowIndex];
    }
    else if (this._activeRowIndex === this._rows.length) {
      this._gameWinCallback(this._game);
    }
  };

  RowManager.prototype.addRow = function() {
    // move all rows down
    this._rows.forEach(function(row) {
      row.forEachAlive(function(element) {
        element.y += this._rowHeight;
      }, this);
    }, this);

    var rowHeight = this.computeYFromRow(0);
    this._rows.push(this._createRow(rowHeight));
  };

  return {
    createRowManager: createRowManager
  };

})();
