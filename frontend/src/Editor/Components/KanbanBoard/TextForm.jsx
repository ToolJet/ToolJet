import React, { Component } from 'react';

export class TextForm extends Component {
  onSubmit = (event) => {
    const form = event.target;
    event.preventDefault();
    this.props.onSubmit(form.input.value);
    form.reset();
  };

  render() {
    return (
      <form onSubmit={this.onSubmit} ref={(node) => (this.form = node)}>
        <input type="text" className="TextForm__input" name="input" placeholder={this.props.placeholder} />
      </form>
    );
  }
}
