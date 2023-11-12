export interface Discusions {
    links: {
        first: string;
        last: string;
    };
    data: Discussion[];
}

export interface CreateDiscussion {
    data: {
        type: 'discussions';
        attributes: {
          title: string;
          content: string;
        },
        relationships: {
            tags: {
                data: {
                    type: 'tags',
                    id: string
                }[];
            }
        }
    }
}

export interface Discussion {
    data: {
        type: string;
        id: string;
        attributes: DataAttributes;
        relationships: Relationships;
    };
    included: Included[];
}

export interface DataAttributes {
    title: string;
    slug: string;
    commentCount: number;
    participantCount: number;
    createdAt: Date;
    lastPostedAt: Date;
    lastPostNumber: number;
    canReply: boolean;
    canRename: boolean;
    canDelete: boolean;
    canHide: boolean;
    lastReadAt: Date;
    lastReadPostNumber: number;
    isApproved: boolean;
    hasUpvoted: boolean;
    hasDownvoted: boolean;
    votes: number;
    seeVotes: boolean;
    canVote: boolean;
    hasBestAnswer: boolean;
    bestAnswerSetAt: null;
    canTag: boolean;
    subscription: null;
    isSticky: boolean;
    canSticky: boolean;
    isLocked: boolean;
    canLock: boolean;
    canEditRecipients: boolean;
    canEditUserRecipients: boolean;
    canEditGroupRecipients: boolean;
    isPrivateDiscussion: boolean;
    canReset: boolean;
    views: number;
    isFirstMoved: boolean;
    canSeeReactions: boolean;
    canSelectBestAnswer: boolean;
    isPopular: number;
}

export interface Relationships {
    posts: Posts;
    user: FirstPost;
    lastPostedUser: FirstPost;
    firstPost: FirstPost;
    lastPost: FirstPost;
    tags: Posts;
    recipientUsers: Posts;
    recipientGroups: Posts;
}

export interface FirstPost {
    data: DAT;
}

export interface DAT {
    type: string;
    id: string;
}

export interface Posts {
    data: DAT[];
}

export interface Included {
    type: string;
    id: string;
    attributes: IncludedAttributes;
}

export interface IncludedAttributes {
    number?: number;
    createdAt?: Date;
    contentType?: string;
    contentHtml?: string;
    renderFailed?: boolean;
    content?: string;
    canEdit?: boolean;
    canDelete?: boolean;
    canHide?: boolean;
    mentionedByCount?: number;
    canSetSpam?: boolean;
    isSpam?: boolean;
    canFlag?: boolean;
    isApproved?: boolean;
    canApprove?: boolean;
    canViewEditHistory?: boolean;
    canDeleteEditHistory?: boolean;
    canRollbackEditHistory?: boolean;
    revisionCount?: number;
    canReact?: boolean;
    reactionCounts?: { [key: string]: number };
    userReactionIdentifier?: null;
    hasUpvoted?: boolean;
    hasDownvoted?: boolean;
    canSeeVotes?: boolean;
    votes?: number;
    canVote?: boolean;
    seeVoters?: boolean;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    slug?: string;
    fofTermsPoliciesState?: {
        '1': {
            accepted_at: Date;
            has_update: boolean;
            must_accept: boolean;
        }
    };
    fofTermsPoliciesHasUpdate?: boolean;
    fofTermsPoliciesMustAccept?: boolean;
    joinTime?: Date;
    name?: string;
    description?: string;
    color?: string;
    backgroundUrl?: null;
    backgroundMode?: null;
    icon?: string;
    discussionCount?: number;
    position?: number;
    defaultSort?: null;
    isChild?: boolean;
    isHidden?: boolean;
    lastPostedAt?: Date;
    canStartDiscussion?: boolean;
    canAddToDiscussion?: boolean;
    subscription?: null;
    isQnA?: boolean;
    reminders?: boolean;
    postCount?: number;
}

export interface TagsResponse {
    type: 'tags';
    id: string;
    attributes: {
        name: string;
        description: string;
        slug: string;
        color: string;
        backgroundUrl: null;
        backgroundMode: null;
        icon: string;
        discussionCount: number;
        position: number | null;
        defaultSort: null;
        isChild: boolean;
        isHidden: boolean;
        lastPostedAt: Date | null;
        canStartDiscussion: boolean;
        canAddToDiscussion: boolean;
        subscription: null;
        isQnA: boolean;
        reminders: boolean;
        postCount: number;
    }
    relationships?: {
        parent: {
            data: {
                type: 'tags';
                id: string;
            }
        }
    }
}