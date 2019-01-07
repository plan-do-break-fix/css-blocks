import { suite, test } from "mocha-typescript";

import { CssBlockError } from "../src";

import { BEMProcessor } from "./util/BEMProcessor";
import { setupImporting } from "./util/setupImporting";

@suite("Block Interfaces")
export class BlockInterfaceTests extends BEMProcessor {
  @test "can detect missing surface area"() {
    let { config, importer } = setupImporting();
    importer.registerSource(
      "foo/bar/base.css",
      `:scope { color: purple; }
       :scope[state|large] { font-size: 20px; }
       .foo   { float: left;   }
       .foo[state|small] { font-size: 5px; }`,
    );

    let filename = "foo/bar/implements.css";
    let inputCSS = `@block base from "./base.css";
                    :scope { implements: base; color: red; }
                    .foo { clear: both; }
                    .b[state|small] {color: blue;}`;

    return this.assertError(
      CssBlockError,
      `Missing implementations for: :scope[state|large], .foo[state|small] ` +
        `from foo/bar/base.css`,
      this.process(filename, inputCSS, config).then(() => {
        importer.assertImported("foo/bar/base.css");
      }));
  }

  @test "can import another block"() {
    let { config, importer } = setupImporting();
    importer.registerSource(
      "foo/bar/base.css",
      `:scope { color: purple; }
       :scope[state|large] { font-size: 20px; }
       .foo   { float: left;   }
       .foo[state|small] { font-size: 5px; }`,
    );
    importer.registerSource(
      "foo/bar/other.css",
      `:scope { color: purple; }
      :scope[state|medium] { font-size: 20px; }
      .foo   { float: left;   }
      .foo[state|medium] { font-size: 5px; }`,
    );

    let filename = "foo/bar/implements.css";
    let inputCSS = `@block base from "./base.css";
                    @block other from "./other.css";
                    :scope { implements: base, other; color: red; }
                    .foo { clear: both; }
                    .b[state|small] {color: blue;}
                    :scope[state|large] { }
                    .foo[state|small] { }`;

    return this.assertError(
      CssBlockError,
      `Missing implementations for: :scope[state|medium], .foo[state|medium] ` +
        `from foo/bar/other.css`,
      this.process(filename, inputCSS, config).then(() => {
        importer.assertImported("foo/bar/base.css");
        importer.assertImported("foo/bar/other.css");
      }));
  }
}
