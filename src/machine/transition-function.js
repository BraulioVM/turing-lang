export default class TransitionFunction {
	constructor(){
		this.transitionTable = {};
	}

	addRule(state, read_symbol, new_state, written_symbol, direction) {
		if (!this.transitionTable[state]){
			this.transitionTable[state] = {};
		}

		this.transitionTable[state][read_symbol] = {
			state: new_state,
			symbol: written_symbol,
			direction: direction
		};
	}

	transition(state, read_symbol){
		return this.transitionTable[state][read_symbol];
	}
	
}