/**
 * UI 2.0 Questionnaire repeated in List view rows (directly or inside a Tabs pane): each row's answer is named by its
 * own row's prompt. Release audit, nesting follow-up (20 Oct, NEST-01): the prompt, error and answer ids were made from
 * the component id alone, so in a List view the second row's answer was named by the first row's prompt ("Alpha
 * question" on Beta's answer). Separate Questionnaires with different ids are the control.
 * Titles carry [ShadQuestionnaire-<AREA>-<NNN>].
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { screen, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ROOT = '44444444-4444-4444-8444-444444444444';
const TABS = '55555555-5555-4555-8555-555555555555';
const SURVEY = '66666666-6666-4666-8666-666666666666';
const OTHER = '77777777-7777-4777-8777-777777777777';

const place = (component, parent, top = 0, height = 220) => {
  component.component.parent = parent;
  component.component.definition.others = { showOnDesktop: binding(true), showOnMobile: binding(false) };
  component.layouts = { desktop: { top, left: 0, width: 35, height } };
  return component;
};

const survey = (id, prompt, type) =>
  componentDefinition(id, `survey${id.slice(0, 3)}`, 'ShadQuestionnaire', {
    items: binding(
      `{{[{name:'answer',prompt:${prompt},type:'${type}',multiline:false,choices:[{label:'Yes',value:'yes'}]}]}}`
    ),
    showProgress: binding(false),
  });

const ANSWER = {
  text: 'input[aria-labelledby],textarea[aria-labelledby]',
  single: '[role="radiogroup"][aria-labelledby]',
  multiple: '[role="group"][aria-labelledby]',
};

let clientWidth;
beforeAll(() => {
  clientWidth = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 800 });
});
afterAll(() => {
  if (clientWidth) Object.defineProperty(Element.prototype, 'clientWidth', clientWidth);
  else delete Element.prototype.clientWidth;
});

const CASES = ['text', 'single', 'multiple'].flatMap((type) =>
  ['separate components', 'List view rows', 'Tabs in List view rows'].map((where) => [type, where])
);

describe('Questionnaire answers repeated in rows', () => {
  test.each(CASES)(
    '[ShadQuestionnaire-A11Y-030] a %s answer in %s is named by its own prompt, with ids of its own',
    async (type, where) => {
      const repeated = where !== 'separate components';
      const inTabs = where === 'Tabs in List view rows';
      const harness = createWidgetHarness({
        componentType: repeated ? 'ShadListView' : 'Container',
        id: ROOT,
        handle: 'owner1',
        capabilities: { dnd: true },
        preload: ['ShadQuestionnaire', ...(inTabs ? ['ShadTabs'] : [])],
        widgetWidth: 950,
        widgetHeight: 850,
      });
      await harness.setup();
      try {
        const extra = {};
        if (inTabs) extra[TABS] = place(componentDefinition(TABS, 'tabs1', 'ShadTabs', {}), ROOT, 0, 300);
        extra[SURVEY] = place(
          survey(SURVEY, repeated ? 'listItem.name+" question"' : '"Alpha question"', type),
          inTabs ? `${TABS}-t0` : ROOT
        );
        if (!repeated) extra[OTHER] = place(survey(OTHER, '"Beta question"', type), ROOT, 300);
        const view = harness.render({
          currentMode: 'view',
          extraComponents: extra,
          properties: repeated
            ? {
                data: binding('{{[{id:"a",name:"Alpha"},{id:"b",name:"Beta"}]}}'),
                idField: binding('id'),
                enablePagination: binding(false),
                itemHeight: binding(350),
              }
            : {},
        });
        await screen.findByText('Beta question');
        await waitFor(() => expect(view.container.querySelectorAll(ANSWER[type])).toHaveLength(2));
        const answers = [...view.container.querySelectorAll(ANSWER[type])];
        expect(answers[0]).toHaveAccessibleName('Alpha question');
        expect(answers[1]).toHaveAccessibleName('Beta question');
        const legends = [...view.container.querySelectorAll('legend')];
        expect(new Set(legends.map((legend) => legend.id)).size).toBe(2);
        answers.forEach((answer, i) =>
          expect(document.getElementById(answer.getAttribute('aria-labelledby'))).toBe(legends[i])
        );
        // The Questionnaire's own ids (frame, prompt, error, answer cards) are unique, and none reuses the component id,
        // which the canvas already gives the widget's wrapper.
        const own = [...view.container.querySelectorAll('[data-step][id], [data-step] [id]')].map((el) => el.id);
        expect(own.filter((id, i) => own.indexOf(id) !== i)).toEqual([]);
        expect(own.filter((id) => id === SURVEY || id === OTHER)).toEqual([]);
      } finally {
        harness.teardown();
      }
    },
    15000
  );
});
