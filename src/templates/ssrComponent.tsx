/**
 * Helper function to render SSR component placeholders.
 */
import * as React from 'react';

export const ssrComponent = (type: string, props: any, key?: string) =>
    key
        ? <div className="__ssr" data-component-type={type} data-component-props={JSON.stringify(props)} key={key} />
        : <div className="__ssr" data-component-type={type} data-component-props={JSON.stringify(props)} />
