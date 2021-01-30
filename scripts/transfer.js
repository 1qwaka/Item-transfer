var scrollPos = 0
//дальность передачи
var range = 240;
//скорость передачи предметов/секунду
var speed = 12;
var sendTime = 60 / speed;

function gradientLine(x, y, x2, y2, c1, c2, stroke) {

  var hstroke = stroke / 2;
  var len = Mathf.len(x2 - x, y2 - y);
  var diffx = (x2 - x) / len * hstroke;
  var diffy = (y2 - y) / len * hstroke;

  Fill.quad(
    x - diffy, y + diffx,
    c1.toFloatBits(),
    x + diffy, y - diffx,
    c1.toFloatBits(),
    x2 + diffy, y2 - diffx,
    c2.toFloatBits(),
    x2 - diffy, y2 + diffx,
    c2.toFloatBits()
  );

}

const int = (i) => new Packages.java.lang.Integer(i);

const transferEffect = new Effect(25, 800, cons(e => {

  if (e.data[1] == null || !(e.data[1] instanceof Posc)) return;

  var x = Mathf.lerp(e.x, e.data[1].x, e.fin());
  var y = Mathf.lerp(e.y, e.data[1].y, e.fin());

  Draw.color(e.color, e.data[1].team.color, e.fin());
  Draw.rect(Core.atlas.find(transfer.name + "-arrow"), x, y, e.rotation)
  Draw.color();
  Draw.rect(e.data[0], x, y);

}));
transferEffect.layer = Layer.power - 0.0001;

const transferEffect2 = new Effect(10, cons(e => {
  Lines.stroke(4 * (e.rotation == 1 ? e.fout() : e.fin()));
  Lines.square(e.x, e.y, e.rotation == 1 ? e.fin() * 6 : e.fout() * 6, 45);
}));


const transfer = extend(Block, "transfer", {

  drawPlace(x, y, r, v) {
    Drawf.dashCircle(x * 8, y * 8, range, Pal.accent);
  },

  setStats() {
    this.super$setStats();
    this.stats.add(Stat.range, +(range / 8).toFixed(1), StatUnit.blocks);
    this.stats.add(Stat.itemsMoved, speed, StatUnit.itemsSecond);
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
  _buffer: {
    items: new Seq(),
    accept(angle,destination, item, amount) {
      this.items.add({
        item: item,
        x: destination.x,
        y: destination.y,
        color: destination.team.color,
        amount: amount,
        progress: 0,
        rotation: angle
      })
    },
    draw(build) {
      this.items.each(cons(i => {

        var x = Mathf.lerp(build.x, i.x, i.progress);
        var y = Mathf.lerp(build.y, i.y, i.progress);

        Draw.color(build.team.color, i.color, i.progress);
        Draw.rect(Core.atlas.find(transfer.name + "-arrow"), x, y, i.rotation)
        Draw.color();
        Draw.rect(i.item.icon(Cicon.medium), x, y);

      }))
    },
    update(build) {
      this.items.each(cons(i=>{
        i.progress+=1/25*Time.delta
        if (i.progress >= 1){
          build = Vars.world.buildWorld(i.x,i.y);
          if(build != null) build.handleItemB(i.item, i.amount);
          this.items.remove(i,true)
        } 
      }))
    },
    read(r) {
      var size = r.i();
      for(var i = 0;i<size;i++){
        var item = Vars.content.getByName(ContentType.item,r.str());
        var x = r.i();
        var y = r.i();
        var color = Color.valueOf(r.str());
        var amount = r.i();
        var progress = r.i();
        var rotation = r.i();
        this.items.add({
          item: item,
          x: x,
          y:y,
          color:color,
          amount: amount,
          progress: progress,
          rotation: rotation
        })
      }
    },
    write(w) {
      w.i(this.items.size);
      this.items.each(cons(i=>{
        w.str(i.item.name);
        w.i(i.x);
        w.i(i.y);
        w.str(i.color.toString());
        w.i(i.amount);
        w.i(i.progress);
        w.i(i.rotation);
      }))
    }
  },

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
    var z = Draw.z();
    Draw.z(Layer.power);
    this.drawBridge();
    //this._buffer.draw(this)
    this.drawAcceptableItems();
    Draw.reset();
    Draw.z(z);
  },

  drawBridge() {

    var vec = new Vec2();
    for (var i = 0; i < this._links.size; i++) {
      var build = Vars.world.build(this._links.get(i));
      if (build == null) continue;
      var angle = Angles.angle(this.x, this.y, build.x, build.y);
      Draw.color(this.team.color);
      Draw.rect(Core.atlas.find(this.block.name + "-end"), this.x, this.y, angle + 90);
      Draw.color(build.team.color);
      Draw.rect(Core.atlas.find(this.block.name + "-end"), build.x, build.y, angle - 90);

      Tmp.c1.set(this.team.color).add(0, 0, 0, -0.7);
      Tmp.c2.set(build.team.color).add(0, 0, 0, -0.7);
      Tmp.v1.trns(angle, 6);
      gradientLine(this.x + Tmp.v1.x, this.y + Tmp.v1.y, build.x - Tmp.v1.x, build.y - Tmp.v1.y, Tmp.c1, Tmp.c2, 9);
      Tmp.v1.trns(angle, 6, 5.25);
      Tmp.v2.trns(angle + 90, 5.25, 6);
      gradientLine(this.x + Tmp.v1.x, this.y + Tmp.v1.y, build.x + Tmp.v2.x, build.y + Tmp.v2.y, this.team.color, build.team.color, 1.25);
      Tmp.v1.trns(angle, 6, -5.25);
      Tmp.v2.trns(angle + 180, 6, 5.25);
      gradientLine(this.x + Tmp.v1.x, this.y + Tmp.v1.y, build.x + Tmp.v2.x, build.y + Tmp.v2.y, this.team.color, build.team.color, 1.25);

    }

  },

  drawAcceptableItems() {
    if (this.acceptableItems.size == 0) return;
    var size = 8;
    var offsetx = 0;
    var offsety = size * 2;
    for (var i = 0; i < this.acceptableItems.size; i++) {
      if (i % 3 == 0 && i != 0) {
        offsety += size
      }
      offsetx = i % 3 * size - size
      Draw.color(0, 0, 0, 0.4);
      Fill.square(this.x + offsetx, this.y + offsety, size / 2);
      Draw.color();
      Draw.rect(this.acceptableItems.get(i).icon(Cicon.small), this.x + offsetx, this.y + offsety, size, size);
    }
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
    this._buffer.update(this)
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
    this._buffer.accept(Angles.angle(this.x, this.y, build.x, build.y),build, item, amount);
    // Time.run(25, run(() => {
    //   build.handleItemB(item, amount);
    // }));
    transferEffect.at(this.x, this.y, Angles.angle(this.x, this.y, build.x, build.y), this.team.color, [item.icon(Cicon.medium), build]);
    transferEffect2.at(this.x, this.y, 1.0);
  },

  handleItemB(item, amount) {
    transferEffect2.at(this.x, this.y, 0.0);
    this.items.add(item, amount);
  },

  canAcceptItem(item) {
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

      table.table(cons(t => {
        t.button("@transfer.accept", Styles.clearTogglet, run(() => this._send = false)).width(90).height(50);
        t.button("@transfer.send", Styles.clearTogglet, run(() => this._send = true)).width(90).height(50);
      }))
      table.row();

      var items = Vars.content.items();
      var cont = new Table();
      cont.defaults().size(30);

      var group = new ButtonGroup();
      group.setMinCheckCount(0);

      cont.button(Icon.cancel, run(() => this.acceptableItems.clear()));
      for (var i = 1; i < items.size; i++) {
        if (items.get(i).isHidden()) continue;
        this.addButton(cont, items.get(i), group);
        if (i % 6 == 5) cont.row();
      }

      var pane = new ScrollPane(cont, Styles.smallPane);
      pane.setScrollingDisabled(true, false);
      pane.setScrollYForce(scrollPos);
      pane.update(run(() => {
        scrollPos = pane.getScrollY();
      }));
      pane.setOverscroll(false, false);


      //var col = new Collapser(cons(t=>t.add(pane)),true);

      table.add(pane).width(180).maxHeight(Scl.scl(90)).growX();

    } catch (e) {
      print(e);
      print(e.stack);
    }

  },

  addButton(cont, item, group) {
    var button = cont.button(new TextureRegionDrawable(item.icon(Cicon.medium)), Styles.clearToggleTransi, 30, run(() => {
      //Vars.control.input.frag.config.hideConfig();
      this.addAcceptItem(item);
      button.setChecked(!button.isChecked())
    })).group(group).get();
    //button.update(run(()=>))
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
    this._buffer.write(write)
  },

  read(read, re) {
    this._send = read.bool();
    var size = read.i();
    for (var i = 0; i < size; i++) {
      this._links.add(read.i())
    }
    this._buffer.read(read)
  }

});