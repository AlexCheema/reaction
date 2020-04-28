import { Box, Button, TextArea } from "@artsy/palette"
import { Conversation_conversation } from "__generated__/Conversation_conversation.graphql"
import React, { useState } from "react"
import { Environment } from "react-relay"
import { SendConversationMessage } from "../Mutation/SendConversationMessage"

interface ReplyProps {
  conversation: Conversation_conversation
  environment: Environment
}

export const Reply: React.FC<ReplyProps> = props => {
  const { environment, conversation } = props
  const [bodyText, setBodyText] = useState("")
  return (
    <Box m={1}>
      <TextArea
        description="For your security do not share personal information."
        onChange={event => setBodyText(event.value)}
      />
      <Button
        onClick={_event =>
          SendConversationMessage(
            environment,
            conversation,
            bodyText,
            _response => {
              setBodyText(null)
            },
            _error => {
              setBodyText(null)
            }
          )
        }
      >
        Reply
      </Button>
    </Box>
  )
}
