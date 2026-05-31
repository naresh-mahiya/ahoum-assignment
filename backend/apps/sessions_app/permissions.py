from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsCreatorOrReadOnly(BasePermission):
    """Read for anyone; write only for authenticated creators."""

    message = 'Only creators can create or modify sessions.'

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_creator
        )


class IsOwnerOrReadOnly(BasePermission):
    """Object-level: only the owning creator may modify."""

    message = 'You can only modify your own sessions.'

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.creator_id == request.user.id
