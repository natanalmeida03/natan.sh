export interface NoteListItem {
    id: string;
    title: string;
    excerpt?: string | null;
    tags: string[];
    accent_color?: string | null;
    icon?: string | null;
    is_pinned: boolean;
    is_archived: boolean;
    is_protected: boolean;
    is_locked: boolean;
    created_at: string;
    updated_at: string;
}

export interface Note extends NoteListItem {
    content: string;
}

export interface NoteInput {
    title: string;
    content: string;
    tags?: string[];
    accent_color?: string | null;
    icon?: string | null;
    is_pinned?: boolean;
    is_archived?: boolean;
    is_protected?: boolean;
    password?: string | null;
}
