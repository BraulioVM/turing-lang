import Tape from './tape.js';
import TransitionFunction, { LEFT, RIGHT } from './transition-function.js';
import { EventEmitter } from 'events';

export { LEFT, RIGHT } from './transition-function.js';

export default class TuringMachine extends EventEmitter {
	constructor(initState, haltState){
		super();

		// machine components getting ready
		this.tape = new Tape();
		this.transitionFunction = new TransitionFunction();

		// machine getting initialized
		this.headPosition = 0;
		this.currentState = initState;
		this.haltState = haltState;
	}


	addRule(state, readSymbol, newState, writtenSymbol, direction){
		this.transitionFunction.addRule(state, readSymbol, newState, writtenSymbol, direction);
	}

	step() {

		if (!this.computationEnded()){
			let readSymbol = this.tape.read(this.headPosition);
			let { state, symbol, direction } = this.transitionFunction.call(this.currentState, readSymbol);

			this.currentState = state;
			this.tape.write(this.headPosition, symbol);

			if (direction === LEFT){
				this.headPosition -= 1;
			} else if (direction === RIGHT){
				this.headPosition += 1;
			}
		}

	}

	computationEnded(){
		return this.currentState == this.haltState;
	}

	surroundingData(size){
		return this.tape.readBulk(this.headPosition - size, this.headPosition + size);
	}
}