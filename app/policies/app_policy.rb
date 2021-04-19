class AppPolicy < ApplicationPolicy
    attr_reader :user, :record

    def initialize(user, record)
      @user = user
      @record = record
    end

    def index?
      @user.admin? || @user.org_admin?
    end

    def show?
      @user.admin? || @user.org_admin?
    end

    def create?
      @user.admin? || @user.org_admin?
    end

    def update?
      @user.admin? || @user.org_admin?
    end

    def users?
      @user.admin? || @user.org_admin?
    end


    class Scope
      attr_reader :user, :scope

      def initialize(user, scope)
        @user = user
        @scope = scope
      end

      def resolve
        if @user.admin?
          scope.all
        else
          scope.where(organization: current_organization)
        end
      end
    end
  end
