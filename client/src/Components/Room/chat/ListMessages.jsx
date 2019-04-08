import React, { Component } from 'react';
import { connect } from 'react-redux';
import Message from './Message';

class ListMessages extends Component {
  componentDidUpdate() {
    this.messages.scrollTo(0, 100000);
  }

  renderSingleMessage = (currentMessage, i) => {
    const { list, roomID, selfName } = this.props;
    let renderHeader = true;
    const previousMessage = list[i - 1];
    if (previousMessage && previousMessage.name === currentMessage.name) {
      renderHeader = false;
    }

    const nameRegExp = new RegExp(`@${selfName}`);
    let highlight = false;
    if (nameRegExp.test(currentMessage.message)) {
      highlight = true;
    }

    if (currentMessage.roomID !== roomID) {
      return;
    }
    return (
      <Message
        key={currentMessage.id}
        color={currentMessage.color}
        name={currentMessage.name}
        highlight={highlight}
        online
        renderHeader={renderHeader}
        image={currentMessage.image}
        body={currentMessage.message}
      />
    );
  };

  render() {
    const { list } = this.props;
    return (
      <div ref={ref => (this.messages = ref)} className="chat-messages">
        {list.map((message, index) => this.renderSingleMessage(message, index))}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  list: state.Chat.list,
  selfName: state.profile.name,
  roomID: state.MainStates.roomID,
});

export default connect(mapStateToProps)(ListMessages);
