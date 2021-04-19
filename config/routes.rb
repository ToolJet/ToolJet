Rails.application.routes.draw do

  resources :apps, only: [:index, :create, :show, :update] do
    resources :versions, only: [:index, :create, :update]

    get '/users', to: 'apps#users'
  end

  resources :data_sources, only: [:create, :index, :update] do
    post '/authorize_oauth2', to: "data_sources#authorize_oauth2"
    collection do
        post '/test_connection', to: 'data_sources#test_connection'
    end
  end

  resources :data_queries, only: [:create, :index, :update] do 
    post '/run', to: 'data_queries#run'
  end

  resources :organizations, only: [] do
    get '/users', to: 'organizations#users'
  end

  post 'authenticate', to: 'authentication#authenticate'
end
