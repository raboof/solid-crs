import { DemoFormComponent } from './demo/demo-form.component';
import { FormElementComponent } from './forms/form-element.component';
import { CollectionComponent } from './collections/collection.component';
import { CollectionsComponent } from './collections/collections.component';
import { AlertComponent } from './alerts/alert.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ContentHeaderComponent } from './header/content-header.component';
import { DemoContentHeaderComponent } from './demo/demo-content-header.component';

/**
 * Register tags for components.
 */
customElements.define('nde-collection', CollectionComponent);
customElements.define('nde-collections', CollectionsComponent);
customElements.define('nde-form-element', FormElementComponent);
customElements.define('nde-demo-form', DemoFormComponent);
customElements.define('nde-alert', AlertComponent);
customElements.define('nde-sidebar', SidebarComponent);
customElements.define('nde-content-header', ContentHeaderComponent);
customElements.define('nde-demo-content-header', DemoContentHeaderComponent);
