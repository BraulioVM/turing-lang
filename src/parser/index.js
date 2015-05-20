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
	let rules = getRulesFromCode(code);

	rules.forEach((rule) => {
		let machine_rule = parseRule(rule);
		machine.addRule(...machine_rule);
	});

	return machine;
}

function getRulesFromCode(code){
	code = code.split("\t").join(" "); // Replace tabs with spaces
	code = stripComments(code);

	let lines = code.split("\n");
	return lines.filter(notEmpty);
}

function stripComments(code){
	let lines = code.split("\n");
	let result_lines = [];

	lines.forEach(function(line){
		result_lines.push(line.split("#")[0]);
	});

	return result_lines.join("\n");
}


function notComment(line){
	return line[0] !== "#";
}

function notEmpty(line){
	var parts = line.split(" ");
	var notEmptyParts = parts.filter(function(part){ return part.length !== 0; });
	return notEmptyParts.length > 0;
}

function extractRuleParts(rule){
	let ruleParts = rule.split("=>");

	if (ruleParts.length !== 2){
		throw new SyntaxError("Instruction error: " + rule, rule);
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





