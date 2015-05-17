import Machine, {LEFT, RIGHT} from '../machine';

function notComment(line){
	return line[0] !== "#";
}

function notEmpty(line){
	return line.length !== 0;
}

function parseRule(line){
	let [condition, transition] = line.split("=>");
	let [originState, readSymbol] = condition.split(" ").filter(notEmpty);
	let [nextState, symbolToWrite, direction] = transition.split(" ").filter(notEmpty);

	direction = direction == "RIGHT" ? RIGHT : LEFT;

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