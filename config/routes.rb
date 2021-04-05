Rails.application.routes.draw do

  resources :apps, only: [:index, :create, :show, :update]
  resources :data_sources, only: [:create, :index]
  resources :data_queries, only: [:create, :index] do 
    post '/run', to: 'data_queries#run'
  end

  post 'authenticate', to: 'authentication#authenticate'
end
