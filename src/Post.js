import React, { useState, useReducer, useEffect } from 'react'
import { css } from 'glamor'
import Container from './Container'
import { Link } from 'react-router-dom'
import { graphql, compose } from 'react-apollo'
import { API, graphqlOperation } from 'aws-amplify'
import { createPost, updatePost as UpdatePost } from './graphql/mutations'
import { onUpdatePost } from './graphql/subscriptions'
import { getPost } from './graphql/queries'
import uuid from 'uuid/v4'

const CLIENTID = uuid()

const ReactMarkdown = require('react-markdown')
const input = `# This is a header\n\nAnd this is a paragraph\n\n`

async function createNewPost(post) {
  try {
    await API.graphql(graphqlOperation(createPost, { input: post }))
  } catch (err) {
    const data = err.errors[0].data
    console.log({ data })
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'updateMarkdown':
      return {
        ...state,
        markdown: action.markdown
      };
    case 'updateTitle':
      return {
        ...state,
        title: action.title
      };
      case 'updatePost':
    return action.post
    default:
      throw new Error();
  }
}

const Post = ({ updatePost, post }) => {
  const [postState, dispatch] = useReducer(reducer, post)
  const [isEditing, updateIsEditing] = useState(false)

  function toggleMarkdown() {
    updateIsEditing(!isEditing)
  }
  console.log('post title:', post.title)

  useEffect(() => {
    dispatch({
      type: 'updatePost',
      post
    })
  }, [post.name, post.title])

  function updateMarkdown(e) {
    dispatch({
      type: 'updateMarkdown',
      markdown: e.target.value
    })
    const newPost = {
      id: post.id,
      markdown: e.target.value,
      clientId: CLIENTID,
      createdAt: post.createdAt,
      title: post.title
    }
    updatePost(newPost)
  }

  function updatePostTitle (e) {
    dispatch({
      type: 'updateTitle',
      title: e.target.value
    })
    const newPost = {
      id: post.id,
      title: e.target.value,
      clientId: CLIENTID,
      createdAt: post.createdAt,
      markdown: post.markdown
    }
    updatePost(newPost)
  }

  useEffect(() => {
    const subscriber = API.graphql(graphqlOperation(onUpdatePost, {
      id: post.id
    })).subscribe({
      next: data => {
        if (CLIENTID === data.value.data.onUpdatePost.clientId) return
        const post = data.value.data.onUpdatePost
        dispatch({
          type: 'updatePost',
          post
        })
      }
    });
    return () => subscriber.unsubscribe()
  }, [])

  return (
    <Container>
      <div {...styles.header}>
        <Link to='/' {...styles.link}>
          <p {...styles.heading}><span role='img' aria-label='write'>✍️</span> Write with me</p>
        </Link>
      </div>
      <div {...styles.container}>
        <div {...styles.body}>
          <div {...styles.toggleButton}>
            <p {...styles.fancy} {...styles.toggleButtonText} onClick={toggleMarkdown}>
              {isEditing ? 'Save' : 'Edit'}
            </p>
          </div>
          { !isEditing && <h1 {...styles.postTitle}>{postState.title}</h1>}
          { !isEditing && <ReactMarkdown source={postState.markdown} /> }
          { isEditing && (
            <input
              value={postState.title}
              onChange={updatePostTitle}
              {...styles.input}
              placeholder='Post Title'
            />
          )}
          { isEditing && <textarea {...styles.textarea} value={postState.markdown} onChange={updateMarkdown} /> }
        </div>
      </div>
    </Container>
  )
}

const PostWithData = compose(
  graphql(UpdatePost, {
    props: props => ({
      updatePost: (post) => {
        console.log('post:', post)
        props.mutate({
          variables: { input: post },
          optimisticResponse: () => ({
            updatePost: { ...post, __typename: 'Post' }
          }),
        })
      }
    })
  }),
  graphql(getPost, {
    options: props => {
      return {
        variables: {
          id: props.match.params.id
        },
        fetchPolicy: 'cache-and-network'
      }
    },
    props: props => {
      console.log('props:', props)
      if (props.data.getPost) {
        return {
          post: props.data.getPost
        }
      } else {
        const { id, name } = props.ownProps.match.params
        const post = {
          clientId: CLIENTID,
          id,
          title: name,
          markdown: input
        }

        API.graphql(graphqlOperation(createPost, { input: post }))
          .then(data => {
            console.log('post created successfully: ', data)
          })
          .catch(err => {
            if (err.errors[0].errorType !== "DynamoDB:ConditionalCheckFailedException") {
              console.log('error creating post: ', err)
            }
          })

        return {
          post
        }
      }
    }
  })
)(Post)

export default PostWithData;

const styles = {
  header: css({
    height: 70,
    boxShadow: '0px 0px 12px rgba(0, 0, 0, .2)',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 30,
  }),
  link: css({
    textDecoration: 'none',
    color: 'black'
  }),
  heading: css({
    margin: 0,
    fontFamily: "Francois One, sans-serif",
    fontSize: 28
  }),
  toggleButton: css({
    width: 80,
    cursor: 'pointer',
    backgroundColor: '#66e2d5',
    border: '2px solid black',
  }),
  toggleButtonText: css({
    textAlign: 'center',
    fontSize: 18,
    margin: '2px 0px'
  }),
  fancy: css({
    fontFamily: "Francois One, sans-serif"
  }),
  input: css({
    outline: 'none',
    border: 'none',
    fontFamily: "ZCOOL XiaoWei, serif",
    fontSize: 38,
    marginTop: 30,
    marginBottom: 8,
    color: 'rgba(0, 0, 0, .35)',
    width: '900px'
  }),
  textarea: css({
    width: 900,
    marginTop: 10,
    border: '3px solid black',
    minHeight: 'calc(100vh - 350px)',
    outline: 'none',
    fontSize: 18
  }),
  postTitle: css({
    fontFamily: "ZCOOL XiaoWei, serif",
    fontSize: 66
  }),
  container: css({
    overflowY: 'scroll',
    maxHeight: 'calc(100vh - 98px)',
  }),
  body: css({
    padding: '50px 0px 0px',
    width: '900px',
    margin: '0 auto',
  })
}
