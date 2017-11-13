var playState = (function() {

  var columnsCount = 25;
  var spriteWidth = config.gameWidth / columnsCount;
  var spriteHeight = 1.5 * spriteWidth;

  //var rowsCount = Math.floor((config.gameHeight / spriteHeight) / 3);
  var rowsCount = 2;
  var nucFac;
  var rt = null;
  var rowMan = null;
  var nrtiMan = null;
  var bacteriaFilter;
  var bacteriaSprite;
  var active;
  var timer;

  function init() {
    active = true;
  }

  function create() {
    this.stage.backgroundColor = "#333333";
    this.physics.startSystem(Phaser.Physics.ARCADE);

    bacteriaFilter = new Phaser.Filter(this, null, config.bacteriaShaderStr);
    bacteriaFilter.setResolution(config.gameWidth, config.gameHeight);
    bacteriaSprite = this.add.sprite();
    bacteriaSprite.width = config.gameWidth;
    bacteriaSprite.height = config.gameHeight;
    bacteriaSprite.filters = [bacteriaFilter];
    bacteriaSprite.inputEnabled = true;
    bacteriaSprite.events.onInputDown.add(stageClicked, this);

    var factoryOptions = {
      game: this.game,
      spriteWidth: spriteWidth,
      spriteHeight: spriteHeight
    };
    nucFac = nucleobases.createNucleobaseFactory(factoryOptions);

    var rowManOptions = {
      game: this.game,
      columnsCount: columnsCount,
      rowsCount: rowsCount,
      columnWidth: spriteWidth,
      rowHeight: spriteHeight,
      elementConstructor: nucFac.createRandomNucleobase.bind(nucFac),
      gameWinCallback: gameWinCallback
    };
    rowMan = rowManager.createRowManager(rowManOptions);

    var nrtiOptions = {
      game: this.game,
      nucFac: nucFac,
      gameWidth: config.gameWidth,
      gameHeight: config.gameHeight,
      columnWidth: spriteWidth,
      rowHeight: spriteHeight 
    };
    nrtiMan = nrtiManager.createNRTIManager(nrtiOptions);

    var rtOptions = {
      game: this.game,
      nucFac: nucFac,
      rowManager: rowMan,
      nrtiManager: nrtiMan,
      blockedCallback: rtBlockedCallback
    };

    rt = reverseTranscriptase.createReverseTranscriptase(rtOptions);
    rt.activate();

    var graphics = this.add.graphics();
    graphics.beginFill(0xFF0000, 0.3);
    //graphics.drawCircle(this.world.centerX, this.world.centerY, 500);
    graphics.drawRect(0, maxY(), config.gameWidth, config.gameHeight);

    nrtiMan.createNRTI();

    this.game.time.events.loop(Phaser.Timer.SECOND * 5, addRow.bind(this));
  }

  function update() {
    bacteriaFilter.update();
    
    this.game.physics.arcade.overlap(nrtiMan.getNRTI(), rowMan.getActiveRow(),
      gridOverlapHandler, null, this);
    this.game.physics.arcade.overlap(nrtiMan.getNRTI(),
      rt.getComplementStrand(), dnaOverlapHandler, null, this);

    if (!nrtiMan.getMatched()) {
      checkMatches();
    }
  }

  function render() {
    this.game.debug.text(this.time.fps, 10, 10, '#ffffff');
  }

  function gridOverlapHandler(nucleotide, rna) {
    nrtiMan.gridOverlapHandler();
  }

  function dnaOverlapHandler(dna, nrti) {
    nrtiMan.resetNRTI();
  }

  function matchedBase(obj1, obj2) {
    return nucleobases.rnaComplement(obj1.data.nucleobaseType) ===
      obj2.data.nucleobaseType;
  }

  function checkMatches() {
    if (nrtiMan.getNRTI().data.overlapping) {

      var nearestRNA;
      var column;
      for (column = 0; column < rowMan.getActiveRow().length; column++) {
        var rowRNA = rowMan.getActiveRow().getAt(column);

        if (floatCloseEnough(rowRNA.x, nrtiMan.getNRTI().x)) {
          nearestRNA = rowRNA;
          break;
        }
      }

      if (matchedBase(nrtiMan.getNRTI(), nearestRNA)) {
        nrtiMan.setMatched(true);
        nearestRNA.data.matched = true;
        rt.killRow();
      }
      else {
        nrtiMan.resetNRTI();
      }
    }
  }

  function rtBlockedCallback() {

    rowMan.nextRow();
    if (active) {
      nrtiMan.resetNRTI();
      nrtiMan.setMatched(false);
    }

  }

  function gameWinCallback(game) {
    active = false;
    var textOptions = {
      font: '65px Arial',
      align: 'center',
      fill: '#ff8300'
    }

    var graphics = game.add.graphics();
    graphics.beginFill(0x0F0F0F, 1);
    graphics.drawCircle(game.world.centerX, game.world.centerY, 500);

    var text = game.add.text(game.world.centerX, game.world.centerY,
      "You Win!", textOptions);
    text.anchor.setTo(0.5);

    rt.deactivate();
    nrtiMan.destroyNRTI();

    //bacteriaSprite.events.onInputDown.removeAll();
    //bacteriaSprite.events.onInputDown.add(function() {
    //  game.state.start('playState');
    //});

    game.time.events.add(Phaser.Timer.SECOND * 2, function() {
      game.state.start('homeState');
    }, this);
  }

  function addRow() {
    if (active) {
      rowMan.addRow();
      rt.shiftDown();

      if (nrtiMan.getMatched()) {
        nrtiMan.getNRTI().y += spriteHeight;
      }

      var y = rowMan.getActiveRow().getAt(0).y + spriteHeight; 

      if (y >= maxY()) {
        gameOver(this);
      }
    }
  }

  function maxY() {
    var maxY = config.gameHeight - 4*(spriteHeight/2);
    return maxY;
  }

  function gameOver(game) {
    //this.state.start('homeState');
    var textOptions = {
      font: '65px Arial',
      align: 'center',
      fill: '#ff8300'
    }

    rt.deactivate();
    nrtiMan.destroyNRTI();
    //game.time.events.stop();

    var graphics = game.add.graphics();
    graphics.beginFill(0x0F0F0F, 1);
    graphics.drawCircle(game.world.centerX, game.world.centerY, 500);

    var text = game.add.text(game.world.centerX, game.world.centerY,
      "Game Over!", textOptions);
    text.anchor.setTo(0.5);
    //tame.time.events.resume();
    game.time.events.add(Phaser.Timer.SECOND * 2, function() {
      game.state.start('homeState');
    }, this);


  }

  function stageClicked(sprite, pointer) {
    nrtiMan.moveNRTI(pointer.position.x, pointer.position.y);
  }

  function floatCloseEnough(a, b) {
    return Math.abs(a - b) < 0.0001;
  }

  return {
    init: init,
    create: create,
    update: update,
    render: render
  };
})();
