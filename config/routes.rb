Rails.application.routes.draw do

  resources :apps, only: [:index, :create, :show, :update] do
    resources :versions, only: [:index, :create, :update]

    get '/users', to: 'apps#users'
  end

  resources :data_sources, only: [:create, :index, :update] do
    post '/authorize_oauth2', to: "data_sources#authorize_oauth2"
    collection do
        post '/test_connection', to: 'data_sources#test_connection'
        post '/fetch_oauth2_base_url', to: "data_sources#fetch_oauth2_base_url"
    end
  end

  resources :data_queries, only: [:create, :index, :update] do 
    post '/run', to: 'data_queries#run'
  end

  resources :organizations, only: [] do
    get '/users', to: 'organizations#users'
  end

  resources :organization_users, only: [:create] do 
    post '/change_role', to: 'organization_users#change_role'
  end

  resources :user do 
    collection do
      post '/set_password_from_token', to: 'users#set_password_from_token'
    end
  end

  post 'authenticate', to: 'authentication#authenticate'
end
