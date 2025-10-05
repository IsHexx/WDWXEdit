/*
 * Copyright (c) 2024-2025 IsHexx
 * All rights reserved.
 *
 * This software is proprietary and confidential. No part of this software
 * may be reproduced, distributed, or transmitted in any form or by any means,
 * including photocopying, recording, or other electronic or mechanical methods,
 * without the prior written permission of the author, except in the case of
 * brief quotations embodied in critical reviews and certain other noncommercial
 * uses permitted by copyright law.
 *
 * For permission requests, contact: IsHexx
 */
// 预览视图容器，负责生命周期管理
import { ItemView } from 'obsidian';
import { PreviewController } from '../controllers/preview-controller';
// 更新import路径
import { uevent, waitForLayoutReady } from '../../shared/utils';
export const VIEW_TYPE_WX_PREVIEW = 'wx-preview';
/**
 * 预览视图容器 - 负责Obsidian视图的生命周期管理
 * 采用MVC架构，视图作为容器，业务逻辑委托给控制器
 */
export class PreviewView extends ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.controller = new PreviewController(this.app, this, plugin);
    }
    getViewType() {
        return VIEW_TYPE_WX_PREVIEW;
    }
    getIcon() {
        return 'fish-symbol';
    }
    getDisplayText() {
        return '笔记预览';
    }
    async onOpen() {
        await this.showLoadingState();
        await this.setup();
        uevent('open');
    }
    async setup() {
        await waitForLayoutReady(this.app);
        await this.controller.initialize();
    }
    async onClose() {
        this.controller.cleanup();
        uevent('close');
    }
    async showLoadingState() {
        const container = this.containerEl.children[1];
        container.empty();
        const loading = container.createDiv({ cls: 'loading-wrapper' });
        loading.createDiv({ cls: 'loading-spinner' });
    }
    // 获取容器元素
    getContainer() {
        return this.containerEl.children[1];
    }
    // 获取控制器实例
    getController() {
        return this.controller;
    }
    // Claude Code Update
    // 强制刷新视图
    async forceRefresh() {
        try {
            await this.controller.onRefresh();
        }
        catch (error) {
            console.error('预览视图刷新失败:', error);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJldmlldy12aWV3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJldmlldy12aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7R0FZRztBQUVILGtCQUFrQjtBQUNsQixPQUFPLEVBQUUsUUFBUSxFQUF5QixNQUFNLFVBQVUsQ0FBQztBQUMzRCxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxtQ0FBbUMsQ0FBQztBQUN0RSxhQUFhO0FBQ2IsT0FBTyxFQUFFLE1BQU0sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBRWhFLE1BQU0sQ0FBQyxNQUFNLG9CQUFvQixHQUFHLFlBQVksQ0FBQztBQUVqRDs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sV0FBWSxTQUFRLFFBQVE7SUFHckMsWUFBWSxJQUFtQixFQUFFLE1BQWM7UUFDM0MsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ1osSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLGlCQUFpQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3BFLENBQUM7SUFFRCxXQUFXO1FBQ1AsT0FBTyxvQkFBb0IsQ0FBQztJQUNoQyxDQUFDO0lBRUQsT0FBTztRQUNILE9BQU8sYUFBYSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxjQUFjO1FBQ1YsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUVELEtBQUssQ0FBQyxNQUFNO1FBQ1IsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUM5QixNQUFNLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNuQixNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDbkIsQ0FBQztJQUVELEtBQUssQ0FBQyxLQUFLO1FBQ1AsTUFBTSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkMsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxLQUFLLENBQUMsT0FBTztRQUNULElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDMUIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3BCLENBQUM7SUFFTyxLQUFLLENBQUMsZ0JBQWdCO1FBQzFCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9DLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNsQixNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxFQUFFLGlCQUFpQixFQUFFLENBQUMsQ0FBQztRQUNoRSxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxFQUFFLGlCQUFpQixFQUFFLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRUQsU0FBUztJQUNULFlBQVk7UUFDUixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRCxVQUFVO0lBQ1YsYUFBYTtRQUNULE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztJQUMzQixDQUFDO0lBRUQscUJBQXFCO0lBQ3JCLFNBQVM7SUFDVCxLQUFLLENBQUMsWUFBWTtRQUNkLElBQUk7WUFDQSxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxFQUFFLENBQUM7U0FDckM7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNaLE9BQU8sQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ3JDO0lBQ0wsQ0FBQztDQUNKIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAoYykgMjAyNC0yMDI1IElzSGV4eFxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvZnR3YXJlIGlzIHByb3ByaWV0YXJ5IGFuZCBjb25maWRlbnRpYWwuIE5vIHBhcnQgb2YgdGhpcyBzb2Z0d2FyZVxuICogbWF5IGJlIHJlcHJvZHVjZWQsIGRpc3RyaWJ1dGVkLCBvciB0cmFuc21pdHRlZCBpbiBhbnkgZm9ybSBvciBieSBhbnkgbWVhbnMsXG4gKiBpbmNsdWRpbmcgcGhvdG9jb3B5aW5nLCByZWNvcmRpbmcsIG9yIG90aGVyIGVsZWN0cm9uaWMgb3IgbWVjaGFuaWNhbCBtZXRob2RzLFxuICogd2l0aG91dCB0aGUgcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uIG9mIHRoZSBhdXRob3IsIGV4Y2VwdCBpbiB0aGUgY2FzZSBvZlxuICogYnJpZWYgcXVvdGF0aW9ucyBlbWJvZGllZCBpbiBjcml0aWNhbCByZXZpZXdzIGFuZCBjZXJ0YWluIG90aGVyIG5vbmNvbW1lcmNpYWxcbiAqIHVzZXMgcGVybWl0dGVkIGJ5IGNvcHlyaWdodCBsYXcuXG4gKlxuICogRm9yIHBlcm1pc3Npb24gcmVxdWVzdHMsIGNvbnRhY3Q6IElzSGV4eFxuICovXG5cbi8vIOmihOiniOinhuWbvuWuueWZqO+8jOi0n+i0o+eUn+WRveWRqOacn+euoeeQhlxuaW1wb3J0IHsgSXRlbVZpZXcsIFdvcmtzcGFjZUxlYWYsIFBsdWdpbiB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7IFByZXZpZXdDb250cm9sbGVyIH0gZnJvbSAnLi4vY29udHJvbGxlcnMvcHJldmlldy1jb250cm9sbGVyJztcbi8vIOabtOaWsGltcG9ydOi3r+W+hFxuaW1wb3J0IHsgdWV2ZW50LCB3YWl0Rm9yTGF5b3V0UmVhZHkgfSBmcm9tICcuLi8uLi9zaGFyZWQvdXRpbHMnO1xuXG5leHBvcnQgY29uc3QgVklFV19UWVBFX1dYX1BSRVZJRVcgPSAnd3gtcHJldmlldyc7XG5cbi8qKlxuICog6aKE6KeI6KeG5Zu+5a655ZmoIC0g6LSf6LSjT2JzaWRpYW7op4blm77nmoTnlJ/lkb3lkajmnJ/nrqHnkIZcbiAqIOmHh+eUqE1WQ+aetuaehO+8jOinhuWbvuS9nOS4uuWuueWZqO+8jOS4muWKoemAu+i+keWnlOaJmOe7meaOp+WItuWZqFxuICovXG5leHBvcnQgY2xhc3MgUHJldmlld1ZpZXcgZXh0ZW5kcyBJdGVtVmlldyB7XG4gICAgcHJpdmF0ZSBjb250cm9sbGVyOiBQcmV2aWV3Q29udHJvbGxlcjtcblxuICAgIGNvbnN0cnVjdG9yKGxlYWY6IFdvcmtzcGFjZUxlYWYsIHBsdWdpbjogUGx1Z2luKSB7XG4gICAgICAgIHN1cGVyKGxlYWYpO1xuICAgICAgICB0aGlzLmNvbnRyb2xsZXIgPSBuZXcgUHJldmlld0NvbnRyb2xsZXIodGhpcy5hcHAsIHRoaXMsIHBsdWdpbik7XG4gICAgfVxuXG4gICAgZ2V0Vmlld1R5cGUoKSB7XG4gICAgICAgIHJldHVybiBWSUVXX1RZUEVfV1hfUFJFVklFVztcbiAgICB9XG5cbiAgICBnZXRJY29uKCkge1xuICAgICAgICByZXR1cm4gJ2Zpc2gtc3ltYm9sJztcbiAgICB9XG5cbiAgICBnZXREaXNwbGF5VGV4dCgpIHtcbiAgICAgICAgcmV0dXJuICfnrJTorrDpooTop4gnO1xuICAgIH1cblxuICAgIGFzeW5jIG9uT3BlbigpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5zaG93TG9hZGluZ1N0YXRlKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuc2V0dXAoKTtcbiAgICAgICAgdWV2ZW50KCdvcGVuJyk7XG4gICAgfVxuXG4gICAgYXN5bmMgc2V0dXAoKSB7XG4gICAgICAgIGF3YWl0IHdhaXRGb3JMYXlvdXRSZWFkeSh0aGlzLmFwcCk7XG4gICAgICAgIGF3YWl0IHRoaXMuY29udHJvbGxlci5pbml0aWFsaXplKCk7XG4gICAgfVxuXG4gICAgYXN5bmMgb25DbG9zZSgpIHtcbiAgICAgICAgdGhpcy5jb250cm9sbGVyLmNsZWFudXAoKTtcbiAgICAgICAgdWV2ZW50KCdjbG9zZScpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgc2hvd0xvYWRpbmdTdGF0ZSgpIHtcbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJFbC5jaGlsZHJlblsxXTtcbiAgICAgICAgY29udGFpbmVyLmVtcHR5KCk7XG4gICAgICAgIGNvbnN0IGxvYWRpbmcgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAnbG9hZGluZy13cmFwcGVyJyB9KTtcbiAgICAgICAgbG9hZGluZy5jcmVhdGVEaXYoeyBjbHM6ICdsb2FkaW5nLXNwaW5uZXInIH0pO1xuICAgIH1cblxuICAgIC8vIOiOt+WPluWuueWZqOWFg+e0oFxuICAgIGdldENvbnRhaW5lcigpOiBFbGVtZW50IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGFpbmVyRWwuY2hpbGRyZW5bMV07XG4gICAgfVxuXG4gICAgLy8g6I635Y+W5o6n5Yi25Zmo5a6e5L6LXG4gICAgZ2V0Q29udHJvbGxlcigpOiBQcmV2aWV3Q29udHJvbGxlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2xsZXI7XG4gICAgfVxuXG4gICAgLy8gQ2xhdWRlIENvZGUgVXBkYXRlXG4gICAgLy8g5by65Yi25Yi35paw6KeG5Zu+XG4gICAgYXN5bmMgZm9yY2VSZWZyZXNoKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250cm9sbGVyLm9uUmVmcmVzaCgpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcign6aKE6KeI6KeG5Zu+5Yi35paw5aSx6LSlOicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbn0iXX0=