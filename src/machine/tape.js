export default class Tape {
	constructor(){
		this.initTape();
	}

	initTape() {
		this.minimumIndexWritten = 0;
		this.maximumIndexWritten = 0;
		this.data = {};
	}

	read(i) {
		if (this.data[i]) {
			return this.data[i];
		} else {
			return 0;	// the default symbol
		}
	}

	readBulk(i, j){
		let result = {};	// This will allow negative indexes
		range(i,j).forEach( (k) => {
			result[k] = this.read(k);
		});

		return result;
	}

	write(i, symbol){
		this.minimumIndexWritten = Math.min(this.minimumIndexWritten, i);
		this.maximumIndexWritten = Math.max(this.maximumIndexWritten, i);

		this.data[i] = symbol;
	}

	reset() {
		this.initTape();
	}

	accesedTape(){
		return this.readBulk(this.minimumIndexWritten, this.maximumIndexWritten);
	}
}

function range(i, j){
	let result = [];

	for(let k = i; k < j; k++){
		result.push(k);
	}

	return result;
}