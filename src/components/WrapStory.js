import React, { Component, PropTypes } from 'react';

import { watch } from '../watcher';

class WrapStory extends Component {
  static propTypes = {
    context: PropTypes.object,
    storyFn: PropTypes.func,
    channel: PropTypes.object,
  }

  constructor() {
    super();

    this.onMutation = this.onMutation.bind(this);
    this.watcher = watch();
  }

  componentDidMount() {
    const { channel } = this.props;

    this.watcher.on(this.onMutation);
    this.watcher.init(this.wrapper);

    // TODO move the axe.a11yCheck to the watcher
    // axe.a11yCheck(this.wrapper, {}, (results) => {
    //   channel.emit('addon:a11y:check', results);
    // });
  }

  componentWillUnmount() {
    this.watcher.disconnect();
  }

  onMutation(mutations) {
    console.log(mutations);
  }

  render() {
    const { storyFn, context } = this.props;

    return (<span
        ref={ (container) => { this.wrapper = container; } }
      >
        {storyFn(context)}
      </span>)
  }
}

export default WrapStory;
