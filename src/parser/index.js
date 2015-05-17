import Machine, {LEFT, RIGHT} from '../machine';

export class SyntaxError extends Error {
	constructor(message, line) {
		super();
		this.message = message;
		this.line = line;
	}
}

export function parseRule(line){
	let [condition, transition] = extractRuleParts(line);
	let [originState, readSymbol] = extractCondition(condition);
	let [nextState, symbolToWrite, direction] = extractTransition(transition);

	return [originState, readSymbol, nextState, symbolToWrite, direction];
}

export default function parse(code){
	let machine = new Machine("Q0", "HALT");
	
	let lines = code.split("\n");
	lines = lines.filter(notComment);
	lines = lines.filter(notEmpty);

	lines.forEach((line) => {
		let rule = parseRule(line);
		machine.addRule(...rule);
	});

	return machine;
}

function notComment(line){
	return line[0] !== "#";
}

function notEmpty(line){
	return line.length !== 0;
}

function extractRuleParts(rule){
	let ruleParts = rule.split("=>");

	if (ruleParts.length !== 2){
		throw new SyntaxError("Instruction error", line);
	}

	return ruleParts;
}

function extractCondition(conditionPart) {
	let conditionParts = conditionPart.split(" ").filter(notEmpty);

	if (conditionParts.length !== 2) {
		throw new SyntaxError("Rule Condition Error", line);
	}

	return conditionParts;
}


function extractTransition(transitionPart){
	let transitionParts = transitionPart.split(" ").filter(notEmpty);

	if (transitionParts.length !== 3){
		throw new SyntaxError("Rule transition Error", transitionPart);
	}

	transitionParts[2] = extractDirection(transitionParts[2]);

	return transitionParts;
}

function extractDirection(direction){
	if (direction === "LEFT") {
		return LEFT;
	} else if (direction === "RIGHT") {
		return RIGHT;
	}

	throw new SyntaxError("Rule direction error", direction);
}





