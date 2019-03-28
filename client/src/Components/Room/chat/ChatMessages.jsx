import React, { Component } from 'react';
import { connect } from 'react-redux';
import ChatMessage from './ChatMessage';

class ChatMessages_ extends Component {
  constructor() {
    super();
    this.chatMessages = React.createRef();
  }

  componentDidMount() {
    const { socket } = this.props;
    // const { messages } = this.props;
    socket.addEventListener('message', data => this.handleMessage(data));
  }

  handleMessage = data => {
    const { messageList } = this.props;
    this.setState({ messageList });
    const { current } = this.chatMessages;
    current.scrollTo(0, 100000);
  };

  // {"action":{"name":"message","type":"send","message":"дурики"},"roomId":"bonan"}
  render() {
    const { list, selfName } = this.props;
    return (
      <div ref={this.chatMessages} className="chat-messages">
        {list.map((o, i) => {
          let renderHeader = true;
          if (list[i - 1] && list[i - 1].name === o.name) renderHeader = false;
          const regex = new RegExp(`@${selfName}`);
          let highlight = false;
          if (regex.test(o.body)) highlight = true;
          return (
            <ChatMessage
              // color={o.color}
              // name={o.name}
              // id={o.id}
              // highlight={highlight}
              // online={o.online}
              key={i}
              renderHeader={renderHeader}
              avatar="https://up.bona.cafe/src/e2/bc820d04437e672d68a3f729e1dd99ad5b1c03.png"
              body={o.body.message}
            />
          );
        })}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return { list: state.messages.list, selfName: state.profile.name };
}

export default connect(mapStateToProps)(ChatMessages_);
