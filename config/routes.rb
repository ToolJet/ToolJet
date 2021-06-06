Rails.application.routes.draw do
  resources :apps, only: %i[index create show update] do
    resources :versions, only: %i[index create update]

    get '/users', to: 'apps#users'
  end

  resources :data_sources, only: %i[create index update] do
    post '/authorize_oauth2', to: 'data_sources#authorize_oauth2'
    collection do
      post '/test_connection', to: 'data_sources#test_connection'
      post '/fetch_oauth2_base_url', to: 'data_sources#fetch_oauth2_base_url'
    end
  end

  resources :data_queries, only: %i[create index update] do
    post '/run', to: 'data_queries#run'

    collection do
      post '/preview', to: 'data_queries#preview'
    end
  end

  resources :organizations, only: [] do
    get '/users', to: 'organizations#users'
  end

  resources :organization_users, only: [:create] do
    post '/change_role', to: 'organization_users#change_role'
  end

  resources :app_users, only: [:create]
  resources :folders, only: [:index, :create]
  resources :folder_apps, only: [:create]

  resources :user do
    collection do
      post '/set_password_from_token', to: 'users#set_password_from_token'
    end
  end

  post 'authenticate', to: 'authentication#authenticate'
  post 'signup', to: 'authentication#signup'

  resources :metadata, only: [:index] do 
    collection do
      post '/skip_version', to: 'metadata#skip_version'
      post '/skip_onboarding', to: 'metadata#skip_onboarding'
      post '/finish_installation', to: 'metadata#finish_installation'
    end
  end

  get '/health', to: 'probe#health_check'

end
