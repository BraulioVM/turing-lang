export const 
	LEFT = -1,
	RIGHT = 1;


export class RuleNotFoundException extends Error {
	constructor(condition){
		super();
		this.error = "Rule was not found";
		this.condition = condition;
	}
}

export default class TransitionFunction {
	constructor(){
		this.init();
	}

	init(){
		this.transitionTable = {};
	}

	addRule(state, read_symbol, new_state, written_symbol, direction) {
		if (!(state in this.transitionTable)){
			this.transitionTable[state] = {};
		}

		this.transitionTable[state][read_symbol] = {
			state: new_state,
			symbol: written_symbol,
			direction: direction
		};
	}

	transition(state, readSymbol){
		let transitionTable = this.transitionTable;
		if (state in transitionTable && transitionTable[state]){
			let stateRules = this.transitionTable[state];
			if (readSymbol in stateRules){
				return this.transitionTable[state][readSymbol];
			}
		}

		throw new RuleNotFoundException([state, readSymbol]);

	}

	reset(){
		this.init();
	}
	
}