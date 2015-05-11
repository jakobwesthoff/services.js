import Immutable, {Map, List} from "immutable";

export class SolutionBuilder {
    isSatisfiedBy(definition) {
        return true;
    }

    build(definition) {
        return Immutable.fromJS({
            meta: {
                dependencies: []
            },
            solution: function() {}
        });
    }
}