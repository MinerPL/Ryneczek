import Ryneczek from '@classes/Client';

new Ryneczek().init().then(() => null);

Object.defineProperty(Array.prototype, 'chunk', {
	value: function(chunkSize) {
		const arr = [];
		for (let i = 0; i < this.length; i += chunkSize) arr.push(this.slice(i, i + chunkSize));
		return arr;
	},
});