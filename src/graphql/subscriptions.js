// eslint-disable
// this is an auto generated file. This will be overwritten
import gql from 'graphql-tag'

export const onCreatePost = gql`subscription OnCreatePost {
  onCreatePost {
    id
    clientId
    markdown
    title
    createdAt
  }
}
`;
export const onUpdatePost = `subscription OnUpdatePost {
  onUpdatePost {
    id
    clientId
    markdown
    title
    createdAt
  }
}
`;
export const onDeletePost = `subscription OnDeletePost {
  onDeletePost {
    id
    clientId
    markdown
    title
    createdAt
  }
}
`;
