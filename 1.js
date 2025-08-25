class A {
  constructor(name) {
    this.name = name;
  }
}

class B extends A {
  constructor(name) {
    super(name);
  }
}

const b = new B("mmm");
console.log(b.name);
