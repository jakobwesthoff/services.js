import Immutable, {Map, List} from "immutable";
import sinon from "sinon";
import expect from "unexpected";
import unexpectedSinon from "unexpected-sinon";
expect.installPlugin(unexpectedSinon);

import {Builder} from "../index";
import Container from "../Library/Container";

import ClassDependencyFixture from "./Fixtures/ClassDependency";
import factoryMethodDependencyFixture from "./Fixtures/factoryMethodDependency";
import valueDependencyFixture from "./Fixtures/valueDependency";

describe("Integration Test", function() {
    var configurationOne, configurationTwo;

    beforeEach(function() {
        configurationOne = {
            services: {
                "Fixture/Class": {
                    "class": ClassDependencyFixture,
                    arguments: [
                        "Fixture/FactoryMethod",
                        "Fixture/Value"
                    ]
                },
                "Fixture/Value": {
                    value: valueDependencyFixture
                },
                "Fixture/FactoryMethod": {
                    factory: factoryMethodDependencyFixture,
                    arguments: [
                        "Fixture/Value"
                    ]
                }
            }
        };

        configurationTwo = {
            services: {
                "Fixture/Class": {
                    "class": ClassDependencyFixture,
                    arguments: [
                        "Fixture/Value",
                        "Fixture/FactoryMethod"
                    ]
                }
            }
        }
    });

    it("should take configuration and return container", function() {
        var builder = new Builder();
        var container = builder.build(configurationOne);

        expect(container, "to be a", Container);
    });

    it("should take multiple configurations and return container", function() {
        var builder = new Builder();
        var container = builder.build([configurationOne, configurationTwo]);

        expect(container, "to be a", Container);
    });

    it("should create container which provides defined services", function() {
        var builder = new Builder();
        var container = builder.build([configurationOne, configurationTwo]);

        expect(container.get("Fixture/Value"), "to be", valueDependencyFixture);
        expect(container.get("Fixture/FactoryMethod"), "to equal", {a: valueDependencyFixture, b: undefined, c: undefined});
        expect(container.get("Fixture/Class"), "to be a", ClassDependencyFixture);
        expect(container.get("Fixture/Class").a, "to be", valueDependencyFixture);
        expect(container.get("Fixture/Class").b, "to equal", {a: valueDependencyFixture, b: undefined, c: undefined});
        expect(container.get("Fixture/Class").c, "to be undefined");
    });
});
