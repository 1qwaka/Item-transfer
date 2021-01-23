var scrollPos = 0
//дальность передачи
var range = 240;
//скорость передачи предметов/секунду
var speed = 10;
var sendTime = 60 / speed;

function quad(region, x1, y1, c1, x2, y2, c2, x3, y3, c3, x4, y4, c4) {
  //var mcolor = Draw.getMixColor().toFloatBits();
  var u = region.u;
  var v = region.v;
  var vertices = []

  var c = Draw.getColor().toFloatBits()
  //var c = Color.valueOf("ffffff77").toFloatBits()

  vertices[0] = x1;
  vertices[1] = y1;
  vertices[2] = c;
  vertices[3] = u;
  vertices[4] = v;
  vertices[5] = c1;

  vertices[6] = x2;
  vertices[7] = y2;
  vertices[8] = c;
  vertices[9] = u;
  vertices[10] = v;
  vertices[11] = c2;

  vertices[12] = x3;
  vertices[13] = y3;
  vertices[14] = c;
  vertices[15] = u;
  vertices[16] = v;
  vertices[17] = c3;

  vertices[18] = x4;
  vertices[19] = y4;
  vertices[20] = c;
  vertices[21] = u;
  vertices[22] = v;
  vertices[23] = c4;

  Draw.vert(region.texture, vertices, 0, vertices.length);
};

const int = (i) => new Packages.java.lang.Integer(i);

const transferEffect = new Effect(25, 800, cons(e => {

  if (e.data[1] == null || !(e.data[1] instanceof Posc)) return;

  var x = Mathf.lerp(e.x, e.data[1].x, e.fin());
  var y = Mathf.lerp(e.y, e.data[1].y, e.fin());

  Draw.rect(Core.atlas.find(transfer.name + "-arrow"), x, y, e.rotation)
  Draw.rect(e.data[0], x, y);

}));
transferEffect.layer = Layer.power - 0.0001;

const transferEffect2 = new Effect(10, cons(e => {
  Lines.stroke(4 * (e.rotation == 1 ? e.fout() : e.fin()));
  Lines.square(e.x, e.y, e.rotation == 1 ? e.fin() * 6 : e.fout() * 6, 45);
}));


const transfer = extend(Block, "transfer", {

  drawPlace(x, y, r, v) {
    Drawf.dashCircle(x * 8 - 4, y * 8 - 4, range, Pal.accent);
  },

  setStats() {
    this.super$setStats();
    this.stats.add(Stat.itemsMoved, speed, StatUnit.itemSecond)
  }

});

transfer.config(Packages.java.lang.Integer, new Cons2({
  get(build, point) {
    if (point != -1) build.addLink(point);
  }
}));

/*
  добавить выбор того, что может принимать
  отображение принимаемых предметов над блоком
  ?жидкости?
  widget group для предметов и ?жидкостей?
  цыет моста плавно перетекающий из цвета одной команды в цвет другой
*/




transfer.buildType = () => extend(Building, {

  //true - отправляет
  //false - принимает
  _send: true,

  _links: new Seq(),
  acceptableItems: new Seq(),
  _index: 0,

  getSend() {
    return this._send;
  },

  addLink(point) {
    if (this._links.contains(point)) {
      this._links.remove(this._links.indexOf(point));
      return;
    }
    this._links.add(point);
  },

  draw() {

    //var r = Core.atlas.white();
    var x = this.x
    var y = this.y + 100

    //Fill.quad(x, y,
    //  Color.blue.toFloatBits(), x, y + 80, Color.black.toFloatBits(), x + 80, y + 80, Color.green.toFloatBits(), x + 80, y, Color.pink.toFloatBits())

    Draw.rect(this.block.region, this.x, this.y);
    var s = (this._send ? "-out" : "-in");
    Draw.rect(this.block.name + s, this.x, this.y);
    Draw.alpha(Mathf.sin(Time.time, 5, 0.7));
    Draw.rect(this.block.name + "-top", this.x, this.y);
    for (var i = 1; i < 3; i++) {
      Draw.alpha(Mathf.sin(Time.time + i * 45, 5, 0.7));
      Draw.rect(this.block.name + s + i, this.x, this.y);
    }
    Draw.color(this.team.color);
    Draw.rect(this.block.name + "-team", this.x, this.y);
    Draw.color();
    this.drawBridge();
  },

  drawBridge() {
    var z = Draw.z();
    Draw.z(Layer.power);
    var vec = new Vec2();
    for (var i = 0; i < this._links.size; i++) {
      var build = Vars.world.build(this._links.get(i));
      if (build == null) continue;
      //Lines.stroke(12.0);
      //Draw.alpha(0.8);
      //Draw.color(this.team.color);
      Draw.rect(Core.atlas.find(this.block.name + "-end"), this.x, this.y, Angles.angle(this.x, this.y, build.x, build.y) + 90);
      //Draw.color(build.team.color);
      Draw.rect(Core.atlas.find(this.block.name + "-end"), build.x, build.y, Angles.angle(this.x, this.y, build.x, build.y) - 90);


      var x = this.x;
      var y = this.y;
      var x2 = build.x;
      var y2 = build.y;

      var hstroke = 12 / 2;
      var len = Mathf.len(x2 - x, y2 - y);
      var diffx = (x2 - x) / len * hstroke;
      var diffy = (y2 - y) / len * hstroke;

      Draw.color(Color.white)

      quad(
        Core.atlas.find(this.block.name + "-bridge"),
        x - diffy, y + diffx,
        this.team.color.toFloatBits(),
        x + diffy, y - diffx,
        this.team.color.toFloatBits(),
        x2 + diffy, y2 - diffx,
        build.team.color.toFloatBits(),
        x2 - diffy, y2 + diffx,
        build.team.color.toFloatBits()
      );

    }
    Draw.reset();
    Draw.z(z);
  },

  validateLinks() {
    /*
      когда элемент с некоторыми индексом убирается,
      все элементы после него сдвигаются на 1 назад,
      так что, переходя к элементу со следующим индексом, мы пропустим 1 элемент,
      который встал на место убранного, и имеет его индекс 
      поэтому нужно делать такой "отступ" каждый раз при удалении элемента
    */
    var offset = 0;
    for (var i = 0; i < this._links.size + offset; i++) {
      if (!this.linkValid(this._links.get(i - offset))) {
        this._links.remove(i - offset);
        offset++;
      }
    }
  },
  updateTile() {
    this.validateLinks();
    if (!this._send) {
      this.dump(null);
      return;
    }
    if (this._links.size == 0 || !this.cons.valid()) return;
    if (this.timer.get(0, sendTime)) {
      if (this.items.empty()) return
      for (var i = 0; i < this._links.size; i++) {
        this._index = (this._index + 1) % this._links.size;
        var build = Vars.world.build(this._links.get(this._index));
        var item = this.items.first();
        if (item != null) {
          if (!build.canAcceptItem(item)) continue;
          this.transferItemTo(build, item, 1);
        }
      }
    }
  },

  //удаляет предмет из блока и добавляет его 
  //в другой блок через нужное время
  transferItemTo(build, item, amount) {
    this.items.remove(item, amount);
    Time.run(25, run(() => {
      build.handleItemB(item, amount);
    }));
    transferEffect.at(this.x, this.y, Angles.angle(this.x, this.y, build.x, build.y,), [item.icon(Cicon.medium), build]);
    transferEffect2.at(this.x, this.y, 1.0);
  },

  handleItemB(item, amount) {
    transferEffect2.at(this.x, this.y, 0.0);
    this.items.add(item, amount);
  },

  canAcceptItem(item) {
    print(this)
    print(item)
    print(this.acceptableItems)
    return this.items.get(item) < this.block.itemCapacity && (this.acceptableItems.size == 0 ? true : this.acceptableItems.contains(item))
  },

  drawConfigure() {
    this.super$drawConfigure();

    var sin = Mathf.absin(Time.time, 6, 1);
    Drawf.circles(this.x, this.y, (this.block.size / 2 + 1) * Vars.tilesize + sin - 2);

    for (var i = 0; i < this._links.size; i++) {
      var build = Vars.world.build(this._links.get(i));
      Drawf.circles(build.x, build.y, (build.block.size / 2 + 1) * Vars.tilesize + sin - 2, Pal.place);
      if (this._send) {
        Drawf.arrow(this.x, this.y, build.x, build.y, this.block.size * Vars.tilesize + sin, 4 + sin);
      } else {
        Drawf.arrow(build.x, build.y, this.x, this.y, this.block.size * Vars.tilesize + sin, 4 + sin);
      }
    }

    Drawf.dashCircle(this.x, this.y, range, Pal.accent);
  },

  //возвращает, нужно ли деселектить блок
  onConfigureTileTapped(other) {

    if (this == other) {
      this.configure(int(-1));
      return false;
    }

    if (this._links.contains(other.pos())) {
      this.configure(int(other.pos()));
      return false;
    } else if (other.block.name == this.block.name && this.within(other, range)
      && other.team != this.team && other.getSend() != this.getSend()) {
      this.configure(int(other.pos()));
      return false;
    }

    return true;
  },

  linkValid(point) {
    if (point == -1 || point == null) return false;
    var link = Vars.world.build(point);
    return link != null && link.block.name == this.block.name && link.team != this.team
      && this.within(link, range) && link.getSend() != this.getSend();
  },

  acceptItem(source, item) {
    return this._send && this.items.get(item) < this.getMaximumAccepted(item);
  },

  buildConfiguration(table) {

    try {

      table.background(Styles.black);

      table.button("@transfer.accept", Styles.clearTogglet, run(() => this._send = false)).width(90).height(50);
      table.button("@transfer.send", Styles.clearTogglet, run(() => this._send = true)).width(90).height(50);
      table.row();

      var items = Vars.content.items();
      var cont = new Table();

      for (var i = 0; i < items.size; i++) {
        if (items.get(i).isHidden()) continue;
        this.addButton(cont, items.get(i));
        if (i % 3 == 2) cont.row();
      }

      var pane = new ScrollPane(cont, Styles.smallPane);
      pane.setScrollingDisabled(true, false);
      pane.setScrollYForce(scrollPos);
      pane.update(run(() => {
        scrollPos = pane.getScrollY();
      }));
      pane.setOverscroll(false, false);


      //var col = new Collapser(cons(t=>t.add(pane)),true);

      table.add(pane).width(90).maxHeight(Scl.scl(40));

    } catch (e) {
      print(e);
      print(e.stack);
    }

  },

  addButton(cont, item) {
    cont.button(new TextureRegionDrawable(item.icon(Cicon.medium)), Styles.clearToggleTransi, 25, run(() => {
      Vars.control.input.frag.config.hideConfig();
      this.addAcceptItem(item);
    }));
  },

  addAcceptItem(item) {
    if (this.acceptableItems.contains(item)) {
      this.acceptableItems.remove(item);
    } else {
      this.acceptableItems.add(item);
    }
  },

  write(write) {
    this.validateLinks();
    write.bool(this._send);
    write.i(this._links.size)
    for (var i = 0; i < this._links.size; i++) {
      write.i(this._links.get(i))
    }
  },

  read(read, re) {
    this._send = read.bool();
    var size = read.i();
    for (var i = 0; i < size; i++) {
      this._links.add(read.i())
    }
  }

});