class MetadataController < ApplicationController
  def index

    unless ENV.fetch('CHECK_FOR_UPDATES', true)
      return
    end

    installed_version = TOOLJET_VERSION

    metadata = Metadatum.first
    if metadata
      data = metadata.data
    else
      metadata = Metadatum.create(data: { last_checked: Time.now - 2.days })
      data = metadata.data
    end

    if Time.now - data["last_checked"].to_time > 86400
      check_for_updates(data, installed_version)
      data = metadata.data
    end

    render json: { 
      latest_version: data["latest_version"],
      installed_version: installed_version,
      version_ignored: data["version_ignored"],
      onboarded: data["onboarded"] || false
    }
  end

  def skip_version
    data = Metadatum.first&.data
    data["version_ignored"] = true
    data["ignored_version"] = data["latest_version"]
    Metadatum.first.update(data: data)
  end

  def skip_onboarding
    data = Metadatum.first&.data
    data["onboarded"] = true
    Metadatum.first.update(data: data)
  end

  def finish_installation

    name = params[:name]
    email = params[:email]

    response = HTTParty.post('https://hub.tooljet.io/subscribe',
      verify: false,
      body: { name: name, email: email, installed_version: TOOLJET_VERSION }.to_json,
      headers: { "Content-Type" => "application/json" })

    data = Metadatum.first&.data
    data["onboarded"] = true
    Metadatum.first.update(data: data)
  end

  private 
      def check_for_updates(current_data, installed_version)

        response = HTTParty.post('https://hub.tooljet.io/updates',
          verify: false,
          body: { installed_version: installed_version }.to_json,
          headers: { "Content-Type" => "application/json" })

        data = JSON.parse(response.body)
        latest_version = data["latest_version"]

        if latest_version > '0.5.3' && latest_version != current_data["ignored_version"]
          current_data["latest_version"] = latest_version
          current_data["version_ignored"] = false
        end

        current_data["last_checked"] = Time.now
        Metadatum.first.update(data: current_data)
      end
end
