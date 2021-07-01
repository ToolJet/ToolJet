# frozen_string_literal: true

Lockbox.master_key = ENV.fetch('LOCKBOX_MASTER_KEY').sub('\n', '')
