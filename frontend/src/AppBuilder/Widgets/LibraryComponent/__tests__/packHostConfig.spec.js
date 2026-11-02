import { packComponentConfig as frontendConfig } from '@/AppBuilder/WidgetManager/widgets/packComponent';
import { packComponentConfig as serverConfig } from '../../../../../../server/src/modules/apps/services/widget-config/packComponent';

// The PackComponent host config: what every pack component (Rocket 2.0, Ant, MUI) gets from the host in the
// inspector's Additional Actions, whatever the pack draws. The server keeps its own copy for new and imported apps.
describe('PackComponent host config', () => {
  it('[PackComponent-HOSTCONFIG-001] offers Collapse when hidden in Additional Actions, off by default', () => {
    // Break this catches: a hidden pack widget leaving its gap because the toggle every native widget has is missing.
    expect(frontendConfig.properties.collapseWhenHidden).toEqual({
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    });
    expect(frontendConfig.definition.properties.collapseWhenHidden).toEqual({ value: '{{false}}' });
  });

  it('[PackComponent-HOSTCONFIG-002] gives the server the same host config as the editor', () => {
    // Break this catches: the editor offering a toggle the server's config for new and imported apps lacks.
    expect(serverConfig).toEqual(frontendConfig);
  });
});
