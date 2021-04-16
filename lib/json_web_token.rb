class JsonWebToken
    class << self
      def encode(payload, exp = 24.hours.from_now)
        payload[:exp] = exp.to_i
        JWT.encode(payload, ENV.fetch("SECRET_KEY_BASE"))
      end
   
      def decode(token)
        body = JWT.decode(token, ENV.fetch("SECRET_KEY_BASE"))[0]
        HashWithIndifferentAccess.new body
      rescue
        nil
      end
    end
end