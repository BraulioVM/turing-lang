var should = require("should");
var tm = require("../../lib/machine");

var Machine = tm.default;
var LEFT = tm.LEFT;
var RIGHT = tm.RIGHT;

describe("A turing machine", function(){
	var Q0 = 0,
		Q1 = 1,
		Q2 = 2,
		Q3 = 3,
		HALT = -1;
	
	var machine = new Machine(Q0, HALT);

	it("halts in finite time with a not looping program", function(done){
		machine.addRule(Q0, 0, Q1, 1, RIGHT);
		machine.addRule(Q1, 0, HALT, 0, RIGHT);

		machine.once("halt", function(){
			done();
		});

		machine.run(10);
	});

	it("sends step events", function(done){
		machine.reset();
		machine.addRule(Q0, 0, Q1, 1, RIGHT);
		machine.addRule(Q1, 0, Q2, 0, LEFT);
		machine.addRule(Q2, 1, HALT, 0, RIGHT);

		var steps_called = 0;

		machine.on("step", function(){ steps_called++; });

		machine.once("halt", function() {
			steps_called.should.be.exactly(3);
			done();
		});

		machine.run(10);

	});
	
});