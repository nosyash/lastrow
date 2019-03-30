import React, { Component } from 'react';
import { connect } from 'react-redux';
import Message from './Message';

class ListMessages extends Component {
  constructor() {
    super();
    this.chatMessages = React.createRef();
  }

  componentDidMount() {
    const { socket } = this.props;

    socket.addEventListener('message', () => this.handleMessage());
  }

  componentWillUnmount() {
    const { socket } = this.props;

    socket.removeEventListener('message', () => this.handleMessage());
  }

  handleMessage = () => {
    const { current } = this.chatMessages;
    current.scrollTo(0, 100000);
  };

  renderSingleMessage = (obj, i) => {
    const { list, roomID, selfName } = this.props;
    let renderHeader = true;
    if (list[i - 1] && list[i - 1].name === obj.name) renderHeader = false;
    const regex = new RegExp(`@${selfName}`);
    let highlight = false;
    if (regex.test(obj.message)) highlight = true;
    if (obj.roomID !== roomID) return;
    return (
      <Message
        // color={o.color}
        // name={o.name}
        // id={o.id}
        highlight={highlight}
        online
        key={i}
        renderHeader={renderHeader}
        avatar="https://up.bona.cafe/src/e2/bc820d04437e672d68a3f729e1dd99ad5b1c03.png"
        body={obj.message}
      />
    );
  };

  render() {
    const { list } = this.props;
    return (
      <div ref={this.chatMessages} className="chat-messages">
        {list.map((o, i) => this.renderSingleMessage(o, i))}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    list: state.Chat.list,
    selfName: state.profile.name,
    roomID: state.MainStates.roomID,
  };
}

export default connect(mapStateToProps)(ListMessages);
