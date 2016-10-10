import axe from 'axe-core';

// Config to ensure all modifications will be observed
const config = {
  childList: true,
  attributes: true,
  characterData: true,
  subtree: true,
};

function getRules(options) {
  return axe.getRules()
    .reduce((prev, { ruleId, ...params }) => ({
      ...prev,
      [ruleId]: params,
    }), {});
}

function parseChecks({ any, all, none }) {
  const parse = (checks) =>
    checks.reduce((prev, { id, message, data, impact }) => ({
      ...prev,
      [id]: {
        data,
        message,
        impact,
      }
    }), {});

  return {
    any: parse(any),
    all: parse(all),
    none: parse(none),
  };
}

function watch(options = {}) {
  const rules = getRules();

  // Keep all violations in track based on the dom nodes;
  let nodes = new Map();

  let listeners = [];

  function parseRules(rules, passes = false) {
    rules.forEach((rule) => rule.nodes.forEach((node) => {
      if (node.target.length === 1) {
        const DOMNode = document.querySelectorAll(node.target);

        nodes.set(DOMNode, {
          ...(nodes.get(DOMNode) || { passes: {}, violations: {} }),
          [passes ? 'passes': 'violations']: parseChecks(node),
        });
      } else {
        // See https://github.com/dequelabs/axe-core/blob/master/doc/API.md#passes-and-violations-array;
        throw new Error('Nested (i)frames not yet supported')
      }
    }))
  }

  function checkA11y(context) {
    axe.a11yCheck(
      context,
      options,
      ({ violations, passes }) => {
        parseRules(violations, false);
        parseRules(passes, true);

        listeners.forEach(listener({
          processing: false,
          nodes,
        }));
      }
    );
  }

  return {
    init: (root) => {
      // Create a dom observer
      const observer = new MutationObserver((mutations) => {
        const targets = mutations.map((mutation) => mutation.target);

        targets.forEach((target) => checkA11y(target));
      });

      observer.observe(root, config);

      checkA11y(root);
    },
    // Dispatch changes for related dom nodes to related listeners
    on: (listener) => {
      if (!listeners.includes(listener)) {
        listeners.push(listener);
      }
    },
    disconnect: () => {
      observer.disconnect();
    }
  }
}

export { watch };
