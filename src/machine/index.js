import Tape from './tape.js';
import TransitionFunction, { LEFT, RIGHT, RuleNotFoundException } from './transition-function.js';
import { EventEmitter } from 'events';

export { LEFT, RIGHT } from './transition-function.js';

export default class TuringMachine extends EventEmitter {
	constructor(initState, haltState){
		super();

		this.initState = initState;
		this.haltState = haltState;

		this.init();
	}

	init(){
		// machine components getting ready
		this.tape = new Tape();
		this.transitionFunction = new TransitionFunction();

		// machine getting initialized
		this.headPosition = 0;
		this.currentState = this.initState;
		this.running = false;
	}


	addRule(state, readSymbol, newState, writtenSymbol, direction){
		this.transitionFunction.addRule(state, readSymbol, newState, writtenSymbol, direction);
		this.emit("ruleAdded", [state, readSymbol, newState, writtenSymbol, direction]);
	}

	step() {
		if (this.running) {
			if (!this.computationEnded()){
				let readSymbol = this.tape.read(this.headPosition);
				try {
					let { state, symbol, direction } = this.transition(readSymbol);
					this.currentState = state;
					this.write(symbol);
					this.emit("step", { writtenSymbol: symbol, headPosition: this.headPosition, state });
					
					this.moveHead(direction);
				} catch(e) {
					this.stop();
					this.emit("error", e);
				}
			} else {
				this.stop();
				this.emit("halt", this.tape);
			}
		}

	}

	run(transitionTime = 100){
		this.running = true;
		this.interval_id = setInterval(() => {
			if (this.running) {
				this.step();
			} else {
				clearInterval(this.interval_id);
			}
		}, transitionTime);
	}

	stop(){
		this.running = false;
	}

	transition(readSymbol){
		return this.transitionFunction.transition(this.currentState, readSymbol);
	}

	moveHead(direction){
		if (direction == LEFT){
			this.headPosition -= 1;
		} else {
			this.headPosition += 1;
		}
	}

	reset(){
		this.init();
	}

	write(symbol){
		this.tape.write(this.headPosition, symbol);
	}

	computationEnded(){
		return this.currentState == this.haltState;
	}

	surroundingData(size){
		return this.tape.readBulk(this.headPosition - size, this.headPosition + size);
	}
}