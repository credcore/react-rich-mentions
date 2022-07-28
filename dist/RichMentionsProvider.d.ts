import React from 'react';
import { TMentionContext, TMentionConfig } from './RichMentionsContext';
interface TProps<T = object> {
    children: React.ReactNode | React.ReactNode[];
    configs: TMentionConfig<T>[];
    onUpdate?: (value: string) => void;
    getContext?: React.MutableRefObject<TMentionContext | null> | ((ref: TMentionContext) => void);
    getInitialHTML?: (text: string) => string;
}
export declare function RichMentionsProvider<T = object>({ children, configs, getContext, onUpdate, getInitialHTML, }: TProps<T>): JSX.Element;
export {};
