module Encryptable
  extend ActiveSupport::Concern

  class_methods do
    def attr_encrypted(*attributes)
      attributes.each do |attribute|
        define_method("#{attribute}=".to_sym) do |value|
          return if value.nil?

          public_send(
            "encrypted_#{attribute}=".to_sym,
            EncryptionService.encrypt(value)
          )
        end

        define_method(attribute) do
          value = public_send("encrypted_#{attribute}".to_sym)
          EncryptionService.decrypt(value) if value.present?
        end
      end
    end
  end
end
