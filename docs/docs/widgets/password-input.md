# Password Input

A Password Input widget provides a way for the users to securely enter a password. The Password Input is a one-line plain text editor in which the text is obscured so that it cannot be read, by replacing each character with an asterisk ("*") symbol.

<img class="screenshot-full" src="/img/widgets/password-input/password-input.gif" alt="ToolJet - Widget Reference - Password Input" height="420"/>

#### Properties

| properties      | description |
| ----------- | ----------- |
| Placeholder |  It specifies a hint that describes the expected value.|

#### Validation

| Validation      | description |
| ----------- | ----------- |
| Regex | Use this field to enter a Regular Expression that will validate the password constraints. |
| Min length | Enter the number for a minimum length of password allowed.|
| Max length | Enter the number for the maximum length of password allowed. |
| Custom validation | If the condition results true, the validation passes, and if false, it will display the string. For example: `{{components.passwordInput1.value === 'something' ? true: 'value should be something'}}` |

#### Layout

| Layout      | description |
| ----------- | ----------- |
| Show on desktop | This property have toggle switch. If enabled, the Password Input widget will display in the desktop view else it will not appear. This is enabled by default.|
| Show on mobile | This property have toggle switch. If enabled, the Password Input wisget will display in the mobile view else it will not appear.|

#### Styles

| Style      | Description |
| ----------- | ----------- |
| Visibility | This is to control the visibility of the widget. If `{{false}}` the widget will not visible after the app is deployed. It can only have boolean values i.e. either `{{true}}` or `{{false}}`. By default, it's set to `{{true}}`. |
| Disable |  This property only accepts boolean values. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`. |