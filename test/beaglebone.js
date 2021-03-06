var rewire = require("rewire");
var BeagleBone = rewire("../lib/beaglebone");
var Emitter = require("events").EventEmitter;
var sinon = require("sinon");
var b = require('bonescript');

var bStub = {
  pinMode: function (pin, mode) {},
  digitalRead: function (pin, handler) {
    handler(null);
  },
  analogRead: function (pin, handler) {
    handler(null);
  },
  digitalWrite: function (pin, value) {},
  analogWrite: function (pin, value) {},
  map: b.map
};

BeagleBone.__set__("b", bStub);

function restore(target) {
  for (var prop in target) {
    if (typeof target[prop].restore === "function") {
      target[prop].restore();
    }
  }
}

exports["BeagleBone"] = {
  setUp: function(done) {

    this.clock = sinon.useFakeTimers();

    this.beaglebone = new BeagleBone();

    this.proto = {};

    this.proto.functions = [{
      name: "analogRead"
    }, {
      name: "analogWrite"
    }, {
      name: "digitalRead"
    }, {
      name: "digitalWrite"
    }, {
      name: "servoWrite"
    }];

    this.proto.objects = [{
      name: "MODES"
    }];

    this.proto.numbers = [{
      name: "HIGH"
    }, {
      name: "LOW"
    }];

    this.instance = [{
      name: "pins"
    }, {
      name: "analogPins"
    }];

    done();
  },
  tearDown: function(done) {
    BeagleBone.reset();
    restore(this);
    done();
  },
  shape: function(test) {
    test.expect(
      this.proto.functions.length +
      this.proto.objects.length +
      this.proto.numbers.length +
      this.instance.length
    );

    this.proto.functions.forEach(function(method) {
      test.equal(typeof this.beaglebone[method.name], "function");
    }, this);

    this.proto.objects.forEach(function(method) {
      test.equal(typeof this.beaglebone[method.name], "object");
    }, this);

    this.proto.numbers.forEach(function(method) {
      test.equal(typeof this.beaglebone[method.name], "number");
    }, this);

    this.instance.forEach(function(property) {
      test.notEqual(typeof this.beaglebone[property.name], "undefined");
    }, this);

    test.done();
  },
  readonly: function(test) {
    test.expect(7);

    test.equal(this.beaglebone.HIGH, 1);

    test.throws(function() {
      this.beaglebone.HIGH = 42;
    });

    test.equal(this.beaglebone.LOW, 0);

    test.throws(function() {
      this.beaglebone.LOW = 42;
    });

    test.deepEqual(this.beaglebone.MODES, {
      INPUT: 0,
      OUTPUT: 1,
      ANALOG: 2,
      PWM: 3,
      SERVO: 4
    });

    test.throws(function() {
      this.beaglebone.MODES.INPUT = 42;
    });

    test.throws(function() {
      this.beaglebone.MODES = 42;
    });

    test.done();
  },
  emitter: function(test) {
    test.expect(1);
    test.ok(this.beaglebone instanceof Emitter);
    test.done();
  },
  connected: function(test) {
    test.expect(1);

    this.beaglebone.on("connect", function() {
      test.ok(true);
      test.done();
    });
  },
  ready: function(test) {
    test.expect(1);

    this.beaglebone.on("ready", function() {
      test.ok(true);
      test.done();
    });
  }
};

exports["BeagleBone.prototype.analogRead"] = {
  setUp: function(done) {
    this.clock = sinon.useFakeTimers();

    this.port = "P9_39";
    this.beaglebone = new BeagleBone();

    done();
  },
  tearDown: function(done) {
    BeagleBone.reset();
    restore(this);

    this.beaglebone.removeAllListeners("analog-read-A0");
    this.beaglebone.removeAllListeners("digital-read-9");

    done();
  },
  correctMode: function(test) {
    test.expect(1);

    this.beaglebone.analogRead("A0", function() {});
    test.equal(this.beaglebone.pins[14].mode, 2);

    test.done();
  },

  analogPin: function(test) {
    test.expect(2);

    var value = 1024;

    this.analogRead = sinon.stub(bStub, "analogRead", function(pin, cb) {
      var result = {
        value: 1
      };

      cb(result);
    });

    var handler = function(data) {
      test.equal(data, value);
      test.done();
    };

    this.beaglebone.analogRead(0, handler);

    test.equal(this.beaglebone.pins[14].mode, 2);
  },

  port: function(test) {
    test.expect(1);

    var port = this.port;

    this.analogRead = sinon.stub(bStub, "analogRead", function (pin, cb) {
      test.equal(port, pin);
      test.done();
    });

    var handler = function(data) {};

    this.beaglebone.analogRead("A0", handler);
  },

  handler: function(test) {
    test.expect(1);

    var value = 1024;

    this.analogRead = sinon.stub(bStub, "analogRead", function(pin, cb) {
      var result = {
        value: 1
      };

      cb(result);
    });

    var handler = function(data) {
      test.equal(data, value);
      test.done();
    };

    this.beaglebone.analogRead("A0", handler);
  },

  event: function(test) {
    test.expect(1);

    var value = 1024;
    var event = "analog-read-0";

    this.analogRead = sinon.stub(bStub, "analogRead", function(pin, cb) {
      var result = {
        value: 1
      };

      cb(result);
    });

    this.beaglebone.once(event, function(data) {
      test.equal(data, value);
      test.done();
    });

    var handler = function(data) {};

    this.beaglebone.analogRead("A0", handler);
  }
};

exports["BeagleBone.prototype.digitalRead"] = {
  setUp: function(done) {
    this.clock = sinon.useFakeTimers();

    this.port = "P8_13";

    this.beaglebone = new BeagleBone();

    done();
  },
  tearDown: function(done) {
    BeagleBone.reset();
    restore(this);

    this.beaglebone.removeAllListeners("analog-read-A0");
    this.beaglebone.removeAllListeners("digital-read-3");

    done();
  },
  correctMode: function(test) {
    test.expect(1);

    this.beaglebone.digitalRead(3, function() {});

    test.equal(this.beaglebone.pins[3].mode, 0);

    test.done();
  },

  port: function(test) {
    test.expect(1);

    var port = this.port;

    this.digitalRead = sinon.stub(bStub, "digitalRead", function(pin, cb) {
      test.equal(port, pin);
      test.done();
    });

    var handler = function(data) {};

    this.beaglebone.digitalRead(3, handler);
  },

  handler: function(test) {
    test.expect(1);

    var value = 1;

    this.digitalRead = sinon.stub(bStub, "digitalRead", function(pin, cb) {
      var result = {
        value: 1
      };
      cb(result);
    });

    var handler = function(data) {
      test.equal(data, value);
      test.done();
    };

    this.beaglebone.digitalRead(3, handler);
  },

  event: function(test) {
    test.expect(1);

    var value = 1;
    var event = "digital-read-3";

    this.digitalRead = sinon.stub(bStub, "digitalRead", function(pin, cb) {
      var result = {
        value: 1
      };

      cb(result);
    });


    this.beaglebone.once(event, function(data) {
      test.equal(data, value);
      test.done();
    });

    var handler = function(data) {};

    this.beaglebone.digitalRead(3, handler);
  }
};


exports["BeagleBone.prototype.analogWrite"] = {
  setUp: function(done) {
    this.clock = sinon.useFakeTimers();

    this.port = "P9_39";

    this.analogWrite = sinon.spy(BeagleBone.prototype, "analogWrite");

    this.beaglebone = new BeagleBone();

    done();
  },
  tearDown: function(done) {
    BeagleBone.reset();
    restore(this);
    done();
  },

  mode: function(test) {
    test.expect(3);

    var value = 255;

    // Set pin to INPUT...
    this.beaglebone.pinMode("A0", 0);
    test.equal(this.beaglebone.pins[14].mode, 0);

    // Writing to a pin should change its mode to 1
    this.beaglebone.analogWrite("A0", value);
    test.equal(this.beaglebone.pins[14].mode, 3);
    test.equal(this.beaglebone.pins[14].isPwm, true);

    test.done();
  },

  write: function(test) {
    test.expect(2);

    var value = 255;

    this.beaglebone.analogWrite("A0", value);

    test.ok(this.analogWrite.calledOnce);
    test.deepEqual(this.analogWrite.firstCall.args, [ "A0", value]);

    test.done();
  },

  stored: function(test) {
    test.expect(1);

    var value = 255;
    this.beaglebone.analogWrite("A0", value);

    test.equal(this.beaglebone.pins[14].value, value);

    test.done();
  }
};


exports["BeagleBone.prototype.digitalWrite"] = {
  setUp: function(done) {
    this.clock = sinon.useFakeTimers();

    this.port = "P8_13";

    this.digitalWrite = sinon.spy(BeagleBone.prototype, "digitalWrite");

    this.beaglebone = new BeagleBone();

    done();
  },
  tearDown: function(done) {
    BeagleBone.reset();
    restore(this);
    done();
  },

  mode: function(test) {
    test.expect(3);

    var value = 1;

    // Set pin to INPUT...
    this.beaglebone.pinMode(3, 0);
    test.equal(this.beaglebone.pins[3].mode, 0);

    // Writing to a pin should change its mode to 1
    this.beaglebone.digitalWrite(3, value);
    test.equal(this.beaglebone.pins[3].mode, 1);
    test.equal(this.beaglebone.pins[3].isPwm, false);

    test.done();
  },

  write: function(test) {
    test.expect(2);

    var value = 1;

    this.beaglebone.digitalWrite(3, value);

    test.ok(this.digitalWrite.calledOnce);
    test.deepEqual(this.digitalWrite.firstCall.args, [3, value]);

    test.done();
  },

  stored: function(test) {
    test.expect(1);

    var value = 1;
    this.beaglebone.digitalWrite(3, value);

    test.equal(this.beaglebone.pins[3].value, value);

    test.done();
  }
};

exports["BeagleBone.prototype.servoWrite"] = {
  setUp: function(done) {
    done();
  },
  tearDown: function(done) {
    done();
  },
  alias: function(test) {
    test.expect(1);
    test.equal(
      BeagleBone.prototype.servoWrite,
      BeagleBone.prototype.analogWrite
    );
    test.done();
  }
};


exports["BeagleBone.prototype.pinMode (analog)"] = {
  setUp: function(done) {
    this.clock = sinon.useFakeTimers();


    this.beaglebone = new BeagleBone();

    done();
  },
  tearDown: function(done) {
    restore(this);

    done();
  },
  analogOut: function(test) {
    test.expect(1);

    this.beaglebone.pinMode("A0", 1);

    test.equal(this.beaglebone.pins[14].mode, 1);

    test.done();
  },
  analogIn: function(test) {
    test.expect(2);

    this.beaglebone.pinMode("A0", 0);
    test.equal(this.beaglebone.pins[14].mode, 0);

    this.beaglebone.pinMode(0, 2);

    test.equal(this.beaglebone.pins[14].mode, 2);


    test.done();
  }
};

exports["BeagleBone.prototype.pinMode (digital)"] = {
  setUp: function(done) {
    this.clock = sinon.useFakeTimers();
    this.beaglebone = new BeagleBone();

    done();
  },
  tearDown: function(done) {
    restore(this);

    done();
  },
  digitalOut: function(test) {
    test.expect(1);

    this.beaglebone.pinMode(3, 1);

    test.equal(this.beaglebone.pins[3].mode, 1);

    test.done();
  },
  digitalIn: function(test) {
    test.expect(1);

    this.beaglebone.pinMode(3, 0);

    test.equal(this.beaglebone.pins[3].mode, 0);

    test.done();
  }
};
