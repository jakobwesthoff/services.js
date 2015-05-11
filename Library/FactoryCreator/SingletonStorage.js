export default function SingletonStorage(FactoryCreator, singletonIsDefault = false) {
    return class Singleton {
        constructor(...args) {
            this.factoryCreator = new FactoryCreator(...args);
            this.storage = null;
        }
        canHandle(definition) {
            return this.factoryCreator.canHandle(definition);
        }

        create(definition) {
            var factory = this.factoryCreator.create(definition);
            return (container) => {
                if (this.isSingleton(definition)) {
                    if (this.storage !== null) {
                        return this.storage;
                    }
                }

                var instance = factory(container);

                if (this.isSingleton(definition)) {
                    this.storage = instance;
                }

                return instance;
            }
        }

        isSingleton(definition) {
            return definition.get("isSingleton") === true || (definition.get("isSingleton") === undefined && singletonIsDefault);
        }
    }
}