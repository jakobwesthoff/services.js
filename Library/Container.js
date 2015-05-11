export default class Container {
    constructor(factories) {
        this.factories = factories;
    }

    get(name) {
        if (this.factories.get(name) === undefined) {
            throw new Error(`Required dependency ${name} could not be found.`);
        }

        return this.factories.get(name)(this);
    }
}