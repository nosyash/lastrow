import React, { Component } from 'react';
import { connect } from 'react-redux';
import Message from './Message';

class ListMessages_ extends Component {
  constructor() {
    super();
    this.chatMessages = React.createRef();
  }

  componentDidMount() {
    const { socket } = this.props;

    socket.addEventListener('message', data => this.handleMessage(data));
  }

  componentWillUnmount() {
    const { socket } = this.props;

    socket.removeEventListener('message', data => this.handleMessage(data));
  }

  handleMessage = data => {
    const { messageList } = this.props;
    this.setState({ messageList });
    const { current } = this.chatMessages;
    current.scrollTo(0, 100000);
  };

  renderSingleMessage = (obj, i, selfName) => {
    const { list, roomID } = this.props;
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
    const { list, selfName, roomID } = this.props;
    return (
      <div ref={this.chatMessages} className="chat-messages">
        {list.map((o, i) => this.renderSingleMessage(o, i, selfName))}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    list: state.messages.list,
    selfName: state.profile.name,
    roomID: state.MainStates.roomID,
  };
}

export default connect(mapStateToProps)(ListMessages_);
